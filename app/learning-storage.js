'use strict';
(() => {
  const STORAGE_KEY = 'pl.atelier.learning.v1';
  const SCHEMA_VERSION = 1;
  const BACKUP_FORMAT = 'pomegranate-lily-python-atelier-learning';
  const LOCK_NAME = 'pl.atelier.learning.v1.write';
  const REWARD_TYPES = new Map([
    ['challenge_completed', 5],
    ['reflection_submitted', 2],
    ['debug_recovery_bonus', 2]
  ]);
  let localQueue = Promise.resolve();

  const clone = value => typeof structuredClone === 'function'
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));

  function uid(prefix = 'id') {
    if (globalThis.crypto && typeof crypto.randomUUID === 'function') return prefix + ':' + crypto.randomUUID();
    return prefix + ':' + Date.now().toString(36) + ':' + Math.random().toString(36).slice(2) + ':' + Math.random().toString(36).slice(2);
  }

  function emptyState() {
    return {
      schemaVersion: SCHEMA_VERSION,
      revision: 0,
      writeId: null,
      challenges: {},
      seedLedger: []
    };
  }

  function isObject(value) {
    return !!value && typeof value === 'object' && !Array.isArray(value);
  }

  function isEmpty(state) {
    const challengeValues = Object.values(state.challenges || {});
    return challengeValues.length === 0 && (state.seedLedger || []).length === 0;
  }

  function deriveSeedTotals(ledger) {
    let totalSeedsEarned = 0;
    let totalSeedsInvested = 0;
    let seedBalance = 0;
    for (const event of ledger || []) {
      const amount = Number(event.seedAmount);
      seedBalance += amount;
      if (amount > 0) totalSeedsEarned += amount;
      if (event.eventType === 'garden_investment' && amount < 0) totalSeedsInvested += Math.abs(amount);
    }
    return { totalSeedsEarned, totalSeedsInvested, seedBalance };
  }

  function validateLedger(ledger) {
    if (!Array.isArray(ledger)) throw new Error('Seed ledger must be an array.');
    const ids = new Set();
    let runningBalance = 0;
    for (const event of ledger) {
      if (!isObject(event)) throw new Error('Invalid Seed event.');
      if (event.schemaVersion !== SCHEMA_VERSION) throw new Error('Unsupported Seed event schema.');
      if (typeof event.eventId !== 'string' || !event.eventId) throw new Error('Seed event is missing an event ID.');
      if (ids.has(event.eventId)) throw new Error('Duplicate Seed event ID: ' + event.eventId);
      ids.add(event.eventId);
      if (typeof event.eventType !== 'string') throw new Error('Seed event is missing a type.');
      if (!Number.isInteger(event.seedAmount) || event.seedAmount === 0) throw new Error('Seed amount must be a non-zero integer.');
      if (typeof event.timestamp !== 'string' || Number.isNaN(Date.parse(event.timestamp))) throw new Error('Seed event has an invalid timestamp.');
      if (typeof event.rewardSource !== 'string' || !event.rewardSource) throw new Error('Seed event is missing a reward source.');

      if (REWARD_TYPES.has(event.eventType)) {
        const expectedAmount = REWARD_TYPES.get(event.eventType);
        if (event.seedAmount !== expectedAmount) throw new Error(event.eventType + ' must award +' + expectedAmount + ' Seeds.');
        if (typeof event.challengeId !== 'string' || !event.challengeId) throw new Error('Challenge reward is missing a challenge ID.');
        const suffix = {
          challenge_completed: ':completion',
          reflection_submitted: ':reflection',
          debug_recovery_bonus: ':debug-recovery'
        }[event.eventType];
        if (event.eventId !== 'challenge:' + event.challengeId + suffix) {
          throw new Error('Challenge reward event ID does not match its challenge/type.');
        }
      } else if (event.eventType === 'garden_investment') {
        if (event.seedAmount >= 0) throw new Error('Garden investment must be a Seed debit.');
        if (!event.eventId.startsWith('garden-investment:')) throw new Error('Garden investment has an invalid transaction ID.');
      } else {
        throw new Error('Unsupported Seed event type: ' + event.eventType);
      }

      runningBalance += event.seedAmount;
      if (runningBalance < 0) throw new Error('Seed ledger would produce a negative balance.');
    }
    return true;
  }

  function validateSnapshot(snapshot) {
    if (!isObject(snapshot)) throw new Error('Invalid completion snapshot.');
    if (typeof snapshot.challengeId !== 'string' || !snapshot.challengeId) throw new Error('Snapshot challenge ID is missing.');
    if (!Number.isInteger(snapshot.challengeDefinitionVersion) || snapshot.challengeDefinitionVersion < 1) throw new Error('Snapshot definition version is invalid.');
    if (typeof snapshot.checkedSource !== 'string') throw new Error('Snapshot source must be text.');
    if (typeof snapshot.checkedSourceHash !== 'string' || !snapshot.checkedSourceHash) throw new Error('Snapshot source hash is missing.');
    if (!isObject(snapshot.passingCheckResult) || snapshot.passingCheckResult.outcome !== 'passed') throw new Error('Snapshot is missing a passing check result.');
    if (typeof snapshot.passingCheckTimestamp !== 'string' || Number.isNaN(Date.parse(snapshot.passingCheckTimestamp))) throw new Error('Snapshot passing timestamp is invalid.');
    if (typeof snapshot.completionTimestamp !== 'string' || Number.isNaN(Date.parse(snapshot.completionTimestamp))) throw new Error('Snapshot completion timestamp is invalid.');
    if (typeof snapshot.learnerSubmittedReflection !== 'string') throw new Error('Snapshot reflection must be text.');
  }

  function validateChallengeRecord(id, record) {
    if (!isObject(record)) throw new Error('Invalid challenge record: ' + id);
    const statuses = new Set(['not_started', 'in_progress', 'needs_revision', 'checked', 'completed']);
    if (record.status != null && !statuses.has(record.status)) throw new Error('Invalid challenge status: ' + id);
    if (record.fileName != null && typeof record.fileName !== 'string') throw new Error('Invalid challenge filename: ' + id);
    if (record.reflection != null && typeof record.reflection !== 'string') throw new Error('Invalid challenge reflection: ' + id);
    if (record.completedAt != null && (typeof record.completedAt !== 'string' || Number.isNaN(Date.parse(record.completedAt)))) throw new Error('Invalid completion date: ' + id);
    if (record.completedSnapshot != null) validateSnapshot(record.completedSnapshot);
    for (const key of ['lastCheck', 'lastNeedsRevision', 'pendingDebugRecovery']) {
      if (record[key] != null && !isObject(record[key])) throw new Error('Invalid ' + key + ' record: ' + id);
    }
  }

  function validateState(input) {
    if (!isObject(input)) throw new Error('Learning data must be an object.');
    if (input.schemaVersion !== SCHEMA_VERSION) throw new Error('Unsupported learning schema version.');
    if (!Number.isInteger(input.revision) || input.revision < 0) throw new Error('Learning revision is invalid.');
    if (input.writeId != null && typeof input.writeId !== 'string') throw new Error('Learning write ID is invalid.');
    if (!isObject(input.challenges)) throw new Error('Challenge records must be an object.');
    for (const [id, record] of Object.entries(input.challenges)) validateChallengeRecord(id, record);
    validateLedger(input.seedLedger);
    return input;
  }

  function readState() {
    let raw;
    try {
      raw = localStorage.getItem(STORAGE_KEY);
    } catch (error) {
      throw new Error('Learning storage is unavailable: ' + error.message);
    }
    if (!raw) return emptyState();
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error('Learning data is malformed. Export or clear it manually before continuing.');
    }
    return validateState(parsed);
  }

  async function doMutation(mutator) {
    const latest = readState();
    const draft = clone(latest);
    const result = await mutator(draft, clone(latest));
    validateState(draft);
    draft.revision = latest.revision + 1;
    draft.writeId = uid('write');
    const payload = JSON.stringify(draft);
    try {
      localStorage.setItem(STORAGE_KEY, payload);
    } catch (error) {
      throw new Error('Could not save learning data: ' + error.message);
    }
    const confirmed = readState();
    if (confirmed.revision !== draft.revision || confirmed.writeId !== draft.writeId) {
      throw new Error('Learning data could not be confirmed after saving.');
    }
    return { state: confirmed, result };
  }

  function mutate(mutator) {
    const run = () => doMutation(mutator);
    if (navigator.locks && typeof navigator.locks.request === 'function') {
      return navigator.locks.request(LOCK_NAME, { mode: 'exclusive' }, run);
    }
    const queued = localQueue.then(run, run);
    localQueue = queued.then(() => undefined, () => undefined);
    return queued;
  }

  function eventExists(state, eventId) {
    return state.seedLedger.some(event => event.eventId === eventId);
  }

  function appendEvent(state, event) {
    if (eventExists(state, event.eventId)) return false;
    state.seedLedger.push(event);
    validateLedger(state.seedLedger);
    return true;
  }

  function rewardEvent(challengeId, type, timestamp = new Date().toISOString(), extra = {}) {
    const config = {
      completion: ['challenge_completed', 5, 'challenge_completion'],
      reflection: ['reflection_submitted', 2, 'required_reflection'],
      'debug-recovery': ['debug_recovery_bonus', 2, 'debugging_recovery']
    }[type];
    if (!config) throw new Error('Unknown reward type.');
    return {
      eventId: 'challenge:' + challengeId + ':' + type,
      eventType: config[0],
      challengeId,
      seedAmount: config[1],
      timestamp,
      rewardSource: config[2],
      schemaVersion: SCHEMA_VERSION,
      ...extra
    };
  }

  function gardenEvent(seedCount, transactionId, timestamp = new Date().toISOString()) {
    if (!Number.isInteger(seedCount) || seedCount <= 0) throw new Error('Garden investment must be a positive whole number of Seeds.');
    if (typeof transactionId !== 'string' || !transactionId.startsWith('garden-investment:')) throw new Error('Invalid Garden transaction ID.');
    return {
      eventId: transactionId,
      eventType: 'garden_investment',
      challengeId: null,
      seedAmount: -seedCount,
      timestamp,
      rewardSource: 'atelier_garden',
      schemaVersion: SCHEMA_VERSION
    };
  }

  function createBackup(state = readState()) {
    validateState(state);
    return {
      format: BACKUP_FORMAT,
      schemaVersion: SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      learningState: clone(state)
    };
  }

  function validateBackup(backup) {
    if (!isObject(backup)) throw new Error('Backup must be a JSON object.');
    if (backup.format !== BACKUP_FORMAT) throw new Error('This is not a Python Atelier learning backup.');
    if (backup.schemaVersion !== SCHEMA_VERSION) throw new Error('This backup uses an unsupported schema version.');
    if (typeof backup.exportedAt !== 'string' || Number.isNaN(Date.parse(backup.exportedAt))) throw new Error('Backup timestamp is invalid.');
    const state = validateState(clone(backup.learningState));
    return state;
  }

  async function importIntoEmpty(backup) {
    const imported = validateBackup(backup);
    return mutate((draft) => {
      if (!isEmpty(draft)) {
        const error = new Error('Learning data already exists. Version 1 import only restores into an empty learning record.');
        error.code = 'LEARNING_STORE_NOT_EMPTY';
        throw error;
      }
      draft.challenges = clone(imported.challenges);
      draft.seedLedger = clone(imported.seedLedger);
      validateLedger(draft.seedLedger);
      return {
        challenges: Object.keys(draft.challenges).length,
        ledgerEvents: draft.seedLedger.length,
        totals: deriveSeedTotals(draft.seedLedger)
      };
    });
  }

  window.AtelierLearningStore = Object.freeze({
    STORAGE_KEY,
    SCHEMA_VERSION,
    BACKUP_FORMAT,
    emptyState,
    readState,
    mutate,
    isEmpty,
    deriveSeedTotals,
    validateState,
    validateBackup,
    createBackup,
    importIntoEmpty,
    eventExists,
    appendEvent,
    rewardEvent,
    gardenEvent,
    uid
  });
})();