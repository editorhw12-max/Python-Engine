'use strict';
(() => {
  let currentCheck = null;

  function uid() {
    return (crypto?.randomUUID?.() || (Date.now().toString(36) + Math.random().toString(36).slice(2)));
  }

  function normalizeOutput(value) {
    let text = String(value ?? '').replace(/\r\n?/g, '\n');
    if (text.endsWith('\n')) text = text.slice(0, -1);
    return text;
  }

  function runtimeReady() {
    return typeof rt !== 'undefined' && (rt.st === 'ready' || rt.st === 'stopped') && !currentCheck;
  }

  function clearCaseTimer() {
    if (currentCheck?.timer) clearTimeout(currentCheck.timer);
    if (currentCheck) currentCheck.timer = null;
  }

  function firstVisibleCase(check, results) {
    const test = check.config.tests[0];
    const result = results[0];
    let actual = '';
    if (!result) actual = '[no result]';
    else if (!result.ran) actual = '[' + (result.errorType || 'Error') + ': ' + (result.error || 'program failed') + ']';
    else actual = normalizeOutput(result.stdout);
    return { expected: normalizeOutput(test.expected), actual };
  }

  function buildResult(check, workerPayload, timedOut) {
    const results = check.results;
    const tests = check.config.tests;
    const signature = check.tokenSignature || null;
    let outcome = 'passed';
    let message = 'All implemented self-check cases passed.';
    let casesPassed = 0;

    for (let i = 0; i < tests.length; i++) {
      const r = results[i];
      if (!r) {
        outcome = timedOut ? 'needs_revision' : 'unable';
        if (timedOut) message = 'Your program took too long on a self-check case. Revise it so each case finishes promptly.';
        else message = 'Python Atelier could not finish every self-check case.';
        continue;
      }
      if (!r.ran) {
        outcome = 'needs_revision';
        message = 'Your program raised ' + (r.errorType || 'an error') + ' during self-check. Review the traceback behavior and try again.';
        continue;
      }
      if (normalizeOutput(r.stdout) === normalizeOutput(tests[i].expected)) casesPassed++;
      else {
        outcome = 'needs_revision';
        message = i === 0
          ? 'The public example output does not yet match the required output.'
          : 'The public example may work, but another self-check case still needs revision.';
      }
    }

    if (workerPayload?.fatal) {
      outcome = 'unable';
      message = 'Python Atelier could not fully evaluate this submission automatically.';
    }

    return {
      attemptId: 'check:' + check.config.challengeId + ':' + uid(),
      challengeId: check.config.challengeId,
      definitionVersion: check.config.definitionVersion,
      outcome,
      message,
      casesPassed,
      casesTotal: tests.length,
      checkedAt: new Date().toISOString(),
      sourceSnapshot: check.source,
      tokenSignature: signature,
      firstVisibleCase: firstVisibleCase(check, results),
      timedOut: !!timedOut
    };
  }

  function finishCheck(payload = {}, timedOut = false) {
    const check = currentCheck;
    if (!check) return;
    clearCaseTimer();
    const result = buildResult(check, payload, timedOut);
    const resolve = check.resolve;
    currentCheck = null;
    try { boot('Restarting Python after self-check…'); } catch {}
    resolve(result);
  }

  function timeoutCurrentCase() {
    if (!currentCheck) return;
    try { if (rt.w) rt.w.terminate(); } catch {}
    finishCheck({}, true);
  }

  const handler = {
    handle(message) {
      if (!message || !String(message.type || '').startsWith('check-')) return false;
      if (!currentCheck || message.runId !== currentCheck.runId) return true;

      if (message.type === 'check-signature') {
        currentCheck.tokenSignature = message.signature || null;
      } else if (message.type === 'check-case-start') {
        clearCaseTimer();
        currentCheck.timer = setTimeout(timeoutCurrentCase, currentCheck.config.timeoutMs || 2000);
      } else if (message.type === 'check-case-result') {
        clearCaseTimer();
        currentCheck.results[message.index] = message.result;
      } else if (message.type === 'check-done') {
        finishCheck(message, false);
      }
      return true;
    }
  };
  window.AtelierCheckBridge = handler;

  function getFileSource(name) {
    if (typeof files === 'undefined') return null;
    if (name === active && typeof ed !== 'undefined') files[active] = ed.get();
    return Object.prototype.hasOwnProperty.call(files, name) ? files[name] : null;
  }

  function openFile(name) {
    if (!Object.prototype.hasOwnProperty.call(files, name)) return false;
    if (name !== active) switchFile(name);
    else {
      showFile();
      ed.focus();
    }
    return true;
  }

  function createPracticeFile(preferredName, starterCode) {
    persist();
    let name = preferredName;
    if (Object.prototype.hasOwnProperty.call(files, name)) {
      const dot = preferredName.lastIndexOf('.');
      const base = dot > 0 ? preferredName.slice(0, dot) : preferredName;
      const ext = dot > 0 ? preferredName.slice(dot) : '';
      let i = 2;
      while (Object.prototype.hasOwnProperty.call(files, name)) name = base + '_' + i++ + ext;
    }
    files[name] = String(starterCode || '');
    active = name;
    showFile();
    persist();
    window.dispatchEvent(new CustomEvent('atelier:file-created', { detail: { fileName: name } }));
    return name;
  }

  function runSelfCheck(config) {
    return new Promise((resolve, reject) => {
      if (!runtimeReady()) return reject(new Error('Finish or stop the current Run before checking. Self-checks are not queued.'));
      if (!config || !Array.isArray(config.tests) || !config.tests.length) return reject(new Error('This challenge has no self-check cases.'));
      const source = getFileSource(config.fileName);
      if (typeof source !== 'string') return reject(new Error('Challenge source file is unavailable.'));

      persist();
      const runId = ++rt.seq;
      rt.cur = runId;
      rt.kind = 'check';
      rt.t0 = performance.now();
      rt.stopping = false;
      rt.waiting = false;
      status('running', 'Checking ' + config.fileName + '…');

      currentCheck = {
        config: { ...config, timeoutMs: Math.max(500, Number(config.timeoutMs) || 2000) },
        runId,
        source,
        results: [],
        tokenSignature: null,
        timer: null,
        resolve,
        reject
      };

      try {
        rt.w.postMessage({
          type: 'check',
          runId,
          source,
          tests: config.tests.map(test => ({ inputs: test.inputs || [], expected: String(test.expected ?? '') }))
        });
      } catch (error) {
        currentCheck = null;
        boot('Restarting Python…');
        reject(error);
      }
    });
  }

  window.AtelierAPI = Object.freeze({
    getCurrentSource() {
      persist();
      return ed.get();
    },
    getCurrentFilename() { return active; },
    getFileSource,
    hasFile(name) { return Object.prototype.hasOwnProperty.call(files, name); },
    listFiles() {
      persist();
      return Object.keys(files);
    },
    openFile,
    createPracticeFile,
    runFile(name) {
      if (!openFile(name)) return false;
      run(name);
      return true;
    },
    canSelfCheck: runtimeReady,
    runSelfCheck,
    getRuntimeStatus() { return rt.st; }
  });
})();