'use strict';
(() => {
  const Challenges = window.AtelierChallenges;
  const Store = window.AtelierLearningStore;
  if (!Challenges || !Store) return;

  const statusLabels = {
    not_started: 'Not Started',
    in_progress: 'In Progress',
    needs_revision: 'Needs Revision',
    checked: 'Checked',
    completed: 'Completed'
  };
  const $ = id => document.getElementById(id);
  const roots = {
    practice: $('practiceRoot'),
    garden: $('gardenRoot'),
    record: $('recordRoot')
  };
  let state;
  let activeChallengeId = null;
  let checking = false;
  let gardenSaving = false;
  let gardenPendingTx = null;
  let stateError = null;

  function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }

  function now() { return new Date().toISOString(); }

  async function hashSource(source) {
    if (crypto?.subtle) {
      const bytes = new TextEncoder().encode(source);
      const digest = await crypto.subtle.digest('SHA-256', bytes);
      return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
    }
    let h = 2166136261;
    for (let i = 0; i < source.length; i++) {
      h ^= source.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return 'fnv1a-' + (h >>> 0).toString(16).padStart(8, '0');
  }

  function defaultRecord() {
    return {
      status: 'not_started',
      fileName: null,
      reflection: '',
      completedAt: null,
      completedSnapshot: null,
      lastCheck: null,
      lastNeedsRevision: null,
      pendingDebugRecovery: null
    };
  }

  function getRecord(id) {
    return state?.challenges?.[id] || defaultRecord();
  }

  function totals() {
    return Store.deriveSeedTotals(state?.seedLedger || []);
  }

  function completedCount() {
    return Challenges.challenges.filter(c => getRecord(c.id).status === 'completed').length;
  }

  function nonWhitespaceLength(value) {
    return String(value || '').replace(/\s/g, '').length;
  }

  function statusPill(status) {
    return '<span class="status-pill" data-status="' + status + '">' + escapeHTML(statusLabels[status] || status) + '</span>';
  }

  function renderDecoderBody(layer) {
    const rows = layer.translationKey.map(item =>
      '<div class="decoder-row">' +
        '<div><span class="decoder-label">Assignment phrase</span><strong>' + escapeHTML(item.jargon) + '</strong></div>' +
        '<div class="decoder-arrow" aria-hidden="true">→</div>' +
        '<div><span class="decoder-label">What it means</span><span>' + escapeHTML(item.concept) + '</span></div>' +
        '<div class="decoder-arrow" aria-hidden="true">→</div>' +
        '<div><span class="decoder-label">Python clue</span><code>' + escapeHTML(item.syntax) + '</code></div>' +
      '</div>'
    ).join('');

    const exampleLines = layer.parallelExample.lineByLine.map(line =>
      '<div class="decoder-line">' +
        '<code>' + escapeHTML(line.code) + '</code>' +
        '<p>' + escapeHTML(line.explanation) + '</p>' +
      '</div>'
    ).join('');

    return '<div class="decoder-body">' +
      '<div class="decoder-plain"><span class="decoder-label">What they are asking you to do</span><p>' + escapeHTML(layer.plainEnglish) + '</p></div>' +
      '<div class="decoder-academic"><span class="decoder-label">How an instructor might say the same thing</span><p>“' + escapeHTML(layer.academicJargon) + '”</p></div>' +
      '<div class="decoder-translation"><span class="decoder-label">Translate the technical sentence</span>' + rows + '</div>' +
      '<div class="decoder-example"><div class="decoder-example-head"><span class="decoder-label">Worked parallel example — same pattern, different problem</span><strong>' + escapeHTML(layer.parallelExample.title) + '</strong><p>' + escapeHTML(layer.parallelExample.taskDescription) + '</p></div>' +
        '<pre>' + escapeHTML(layer.parallelExample.code) + '</pre>' +
        '<div class="decoder-lines">' + exampleLines + '</div>' +
      '</div>' +
      '<div class="decoder-now"><strong>Now solve your challenge.</strong><span>The example above uses the same coding pattern on a different topic so you can transfer the idea instead of copying the answer.</span></div>' +
    '</div>';
  }

  function renderAssignmentDecoder(challenge) {
    const layer = challenge.translationLayer;
    if (!layer) return '';

    const body = renderDecoderBody(layer);
    if (layer.scaffoldMode === 'always_expanded') {
      return '<div class="practice-section decoder-section"><div class="assignment-decoder decoder-open"><div class="decoder-title"><span class="learning-kicker">Assignment Decoder</span><h3>Learn how to read the assignment</h3></div>' + body + '</div></div>';
    }

    if (layer.scaffoldMode === 'collapsible') {
      return '<div class="practice-section decoder-section"><details class="assignment-decoder"><summary><span><span class="learning-kicker">Assignment Decoder</span><strong>Break down the wording</strong></span><span aria-hidden="true">＋</span></summary>' + body + '</details></div>';
    }

    return '<div class="practice-section decoder-section"><div class="decoder-on-demand"><p><strong>Stuck on the wording?</strong> Try translating the assignment yourself first. If the technical language is the blocker, open the decoder.</p><button type="button" class="quiet" id="decoderReveal">Decode Assignment</button><div id="decoderHidden" hidden><div class="assignment-decoder decoder-open">' + body + '</div></div></div></div>';
  }

  function showToast(message) {
    if (typeof window.toast === 'function') window.toast(message);
    else {
      const t = $('toast');
      if (!t) return;
      t.textContent = message;
      t.classList.add('show');
      clearTimeout(showToast.t);
      showToast.t = setTimeout(() => t.classList.remove('show'), 3200);
    }
  }

  function showLearningError(root, message) {
    root.innerHTML = '<div class="learning-shell"><div class="learning-note learning-error"><strong>Learning record unavailable.</strong><br>' + escapeHTML(message) + '<br><br>The Python Workbench remains available.</div></div>';
  }

  function refreshState() {
    try {
      state = Store.readState();
      stateError = null;
    } catch (error) {
      state = Store.emptyState();
      stateError = error;
    }
    renderAll();
  }

  function setProductView(viewName) {
    const learning = viewName !== 'workbench';
    document.body.classList.toggle('learning-mode', learning);
    for (const button of document.querySelectorAll('[data-product-view]')) {
      const active = button.dataset.productView === viewName;
      button.setAttribute('aria-current', active ? 'page' : 'false');
    }
    for (const screen of document.querySelectorAll('.learning-screen')) screen.hidden = true;
    if (learning) {
      const screen = $(viewName + 'View');
      if (screen) screen.hidden = false;
    }
    if (location.hash !== '#' + viewName) history.replaceState(null, '', '#' + viewName);
    if (viewName === 'practice') renderPractice();
    if (viewName === 'garden') renderGarden();
    if (viewName === 'record') renderRecord();
  }

  function renderAll() {
    renderPractice();
    renderGarden();
    renderRecord();
  }

  function renderPractice() {
    if (!roots.practice) return;
    if (stateError) return showLearningError(roots.practice, stateError.message);
    const done = completedCount();
    let html = '<div class="learning-shell">' +
      '<div class="learning-head"><div><div class="learning-kicker">Atelier Practice</div><h1>CS50P Foundations</h1><p>Choose a challenge, write real Python in the Workbench, then use Check My Work when you are ready.</p></div>' +
      '<div>' + statusPill(done === Challenges.challenges.length ? 'completed' : 'in_progress') + '</div></div>' +
      '<div class="progress-wrap"><div class="progress-track" aria-label="' + done + ' of ' + Challenges.challenges.length + ' challenges completed"><div class="progress-fill" style="width:' + (done / Challenges.challenges.length * 100) + '%"></div></div><div class="progress-label"><span>' + done + ' of ' + Challenges.challenges.length + ' completed</span><span>Run ≠ completion</span></div></div>';

    if (activeChallengeId) {
      const challenge = Challenges.byId[activeChallengeId];
      if (challenge) html += renderChallengeDetail(challenge);
      html += '</div>';
      roots.practice.innerHTML = html;
      wirePracticeDetail();
      return;
    }

    html += '<div class="learning-grid">';
    for (const challenge of Challenges.challenges) {
      const rec = getRecord(challenge.id);
      html += '<article class="challenge-card">' +
        '<div class="challenge-top"><div><div class="learning-kicker">Challenge ' + (Challenges.challenges.indexOf(challenge) + 1) + '</div><h2>' + escapeHTML(challenge.title) + '</h2></div>' + statusPill(rec.status) + '</div>' +
        '<div class="challenge-concepts">' + challenge.concepts.map(x => '<span>' + escapeHTML(x) + '</span>').join('') + '</div>' +
        '<p>' + escapeHTML(challenge.practice) + '</p>' +
        '<div class="learning-actions"><button type="button" data-open-challenge="' + challenge.id + '">' + (rec.status === 'not_started' ? 'View Challenge' : 'Continue') + '</button>' +
        (rec.fileName ? '<button type="button" class="quiet" data-reopen-work="' + challenge.id + '">Reopen Work</button>' : '') +
        '</div></article>';
    }
    html += '</div></div>';
    roots.practice.innerHTML = html;
    roots.practice.querySelectorAll('[data-open-challenge]').forEach(button => button.onclick = () => {
      activeChallengeId = button.dataset.openChallenge;
      renderPractice();
    });
    roots.practice.querySelectorAll('[data-reopen-work]').forEach(button => button.onclick = () => openChallengeWork(button.dataset.reopenWork, false));
  }

  function renderChallengeDetail(challenge) {
    const rec = getRecord(challenge.id);
    const last = rec.lastCheck;
    const reflectionLength = nonWhitespaceLength(rec.reflection);
    const runtimeReady = window.AtelierAPI?.canSelfCheck?.() === true;
    const checkDisabled = checking || !runtimeReady;
    const currentSource = rec.fileName && window.AtelierAPI?.getFileSource?.(rec.fileName);
    const stale = last?.outcome === 'passed' && typeof currentSource === 'string' && currentSource !== last.sourceSnapshot;

    let checkBox = '';
    if (last) {
      const cls = last.outcome === 'passed' ? 'learning-success' : last.outcome === 'needs_revision' ? 'learning-error' : '';
      const label = last.outcome === 'passed' ? 'Self-Check Passed' : last.outcome === 'needs_revision' ? 'Needs Revision' : last.outcome === 'manual_review' ? 'Manual Review Needed' : 'Unable to Fully Evaluate Automatically';
      checkBox = '<div class="checkbox ' + cls + '"><strong>' + label + '</strong><span>' + escapeHTML(last.message || '') + '</span>';
      if (last.firstVisibleCase && last.outcome !== 'passed') {
        checkBox += '<div class="check-grid"><div><small>Expected</small><code>' + escapeHTML(last.firstVisibleCase.expected) + '</code></div><div><small>Actual</small><code>' + escapeHTML(last.firstVisibleCase.actual) + '</code></div></div>';
      }
      if (stale) checkBox += rec.status === 'completed' ? '<p><strong>Current source changed since this check.</strong> Historical completion remains intact.</p>' : '<p><strong>Source changed after this passing check.</strong> Check the current code again before completion.</p>';
      checkBox += '</div>';
    }

    return '<section class="practice-detail">' +
      '<div class="challenge-top"><div><button type="button" class="tiny quiet" id="practiceBack">← All challenges</button><div class="learning-kicker" style="margin-top:10px">CS50P Foundations</div><h2>' + escapeHTML(challenge.title) + '</h2></div>' + statusPill(rec.status) + '</div>' +
      '<div class="practice-section"><h3>Challenge</h3><p>' + escapeHTML(challenge.instructions) + '</p></div>' +
      renderAssignmentDecoder(challenge) +
      '<div class="practice-section"><h3>What You Are Practicing</h3><p>' + escapeHTML(challenge.practice) + '</p><div class="challenge-concepts" style="margin-top:8px">' + challenge.concepts.map(x => '<span>' + escapeHTML(x) + '</span>').join('') + '</div></div>' +
      '<div class="practice-section"><h3>Example</h3><div class="practice-example"><div class="practice-example-box"><span class="example-label">Input</span><pre>' + escapeHTML(challenge.exampleInput.join('\n')) + '</pre></div><div class="practice-example-box"><span class="example-label">Expected behavior</span><pre>' + escapeHTML(challenge.expectedBehavior) + '</pre></div></div></div>' +
      '<div class="practice-section"><div class="learning-actions">' +
        '<button type="button" class="primary" id="openChallengeWork">' + (rec.fileName ? 'Reopen Workbench' : 'Start Challenge') + '</button>' +
        '<button type="button" id="runChallenge" ' + (!rec.fileName ? 'disabled' : '') + '>▶ Run</button>' +
        '<button type="button" id="checkChallenge" ' + (checkDisabled || !rec.fileName ? 'disabled' : '') + '>' + (checking ? 'Checking…' : 'Check My Work') + '</button>' +
        '<button type="button" class="quiet" id="hintChallenge">Hint</button></div>' +
        '<div id="hintArea"></div>' + checkBox + '</div>' +
      '<div class="practice-section"><h3>Learner-submitted reflection</h3><p>What did you change, and why did it work?</p>' +
        '<textarea class="reflection" id="reflectionField" placeholder="Write at least 30 non-whitespace characters. Length is only a completion requirement; it does not verify understanding.">' + escapeHTML(rec.reflection || '') + '</textarea>' +
        '<div class="reflection-count ' + (reflectionLength >= 30 ? 'good' : '') + '" id="reflectionCount">' + reflectionLength + ' / 30 non-whitespace characters</div>' +
        '<div class="learning-actions" style="margin-top:8px"><button type="button" id="saveReflection">Save Reflection' + (rec.status === 'completed' ? '' : ' / Complete') + '</button></div>' +
        '<div class="learning-note" style="margin-top:10px">Completion requires a passing self-check for the submitted source and a learner-submitted reflection of at least 30 non-whitespace characters. This local record is self-reported learning history, not a credential.</div></div>' +
      '</section>';
  }

  function wirePracticeDetail() {
    const challenge = Challenges.byId[activeChallengeId];
    if (!challenge) return;
    $('practiceBack').onclick = () => { activeChallengeId = null; renderPractice(); };
    $('openChallengeWork').onclick = () => openChallengeWork(challenge.id, true);
    $('runChallenge').onclick = () => runChallenge(challenge.id);
    $('checkChallenge').onclick = () => checkChallenge(challenge.id);
    let hintIndex = 0;
    $('hintChallenge').onclick = () => {
      hintIndex = Math.min(hintIndex + 1, 3);
      $('hintArea').innerHTML = '<div class="hintbox"><strong>Hint ' + hintIndex + ' of 3</strong>' + escapeHTML(challenge.hints[hintIndex - 1]) + '</div>';
    };
    const decoderReveal = $('decoderReveal');
    const decoderHidden = $('decoderHidden');
    if (decoderReveal && decoderHidden) {
      decoderReveal.onclick = () => {
        decoderHidden.hidden = false;
        decoderReveal.hidden = true;
        decoderHidden.querySelector('.assignment-decoder')?.focus?.();
      };
    }
    const reflection = $('reflectionField');
    const count = $('reflectionCount');
    reflection.oninput = () => {
      const n = nonWhitespaceLength(reflection.value);
      count.textContent = n + ' / 30 non-whitespace characters';
      count.classList.toggle('good', n >= 30);
    };
    $('saveReflection').onclick = () => saveReflectionAndMaybeComplete(challenge.id, reflection.value);
  }

  async function openChallengeWork(challengeId, switchView = true) {
    if (!window.AtelierAPI) return showToast('Workbench is not ready.');
    const challenge = Challenges.byId[challengeId];
    let rec = getRecord(challengeId);
    let fileName = rec.fileName;
    const createdFresh = !fileName || !AtelierAPI.hasFile(fileName);
    if (createdFresh) {
      fileName = AtelierAPI.createPracticeFile(challenge.preferredFileName, challenge.starterCode);
    } else {
      AtelierAPI.openFile(fileName);
    }
    try {
      const result = await Store.mutate(draft => {
        const current = draft.challenges[challengeId] || defaultRecord();
        current.fileName = fileName;
        if (createdFresh) {
          current.lastCheck = null;
          current.lastNeedsRevision = null;
          current.pendingDebugRecovery = null;
          if (current.status !== 'completed') current.status = 'in_progress';
        } else if (current.status !== 'completed' && current.status === 'not_started') {
          current.status = 'in_progress';
        }
        draft.challenges[challengeId] = current;
        return fileName;
      });
      state = result.state;
      if (switchView) setProductView('workbench');
      else renderAll();
    } catch (error) {
      showToast(error.message);
    }
  }

  function runChallenge(challengeId) {
    const rec = getRecord(challengeId);
    if (!rec.fileName || !AtelierAPI.hasFile(rec.fileName)) return openChallengeWork(challengeId, true);
    setProductView('workbench');
    AtelierAPI.openFile(rec.fileName);
    AtelierAPI.runFile(rec.fileName);
  }

  async function checkChallenge(challengeId) {
    if (checking) return;
    const challenge = Challenges.byId[challengeId];
    const rec = getRecord(challengeId);
    if (!rec.fileName || !AtelierAPI.hasFile(rec.fileName)) return showToast('Open the challenge work first.');
    if (!AtelierAPI.canSelfCheck()) return showToast('Finish or stop the current Run before checking. Checks are not queued.');

    checking = true;
    renderPractice();
    try {
      const result = await AtelierAPI.runSelfCheck({
        challengeId,
        definitionVersion: challenge.definitionVersion,
        fileName: rec.fileName,
        tests: challenge.tests,
        timeoutMs: 2000
      });
      result.sourceHash = await hashSource(result.sourceSnapshot);
      const mutation = await Store.mutate(draft => {
        const current = draft.challenges[challengeId] || defaultRecord();
        const previousFailure = current.lastNeedsRevision || null;
        current.fileName = rec.fileName;
        current.lastCheck = result;

        if (result.outcome === 'passed') {
          if (current.status !== 'completed') current.status = 'checked';
          if (previousFailure) {
            const meaningful = !!previousFailure.tokenSignature && !!result.tokenSignature && previousFailure.tokenSignature !== result.tokenSignature;
            current.pendingDebugRecovery = meaningful ? {
              failedAttemptId: previousFailure.attemptId,
              failedSourceHash: previousFailure.sourceHash,
              failedAt: previousFailure.checkedAt,
              passingAttemptId: result.attemptId,
              passingSourceHash: result.sourceHash,
              passedAt: result.checkedAt,
              meaningfulChangeResult: 'token_change'
            } : null;
          } else {
            current.pendingDebugRecovery = null;
          }
        } else if (result.outcome === 'needs_revision') {
          if (current.status !== 'completed') current.status = 'needs_revision';
          current.lastNeedsRevision = {
            attemptId: result.attemptId,
            sourceHash: result.sourceHash,
            tokenSignature: result.tokenSignature || null,
            checkedAt: result.checkedAt
          };
          current.pendingDebugRecovery = null;
        } else {
          if (current.status !== 'completed') current.status = 'checked';
          current.pendingDebugRecovery = null;
        }
        draft.challenges[challengeId] = current;
      });
      state = mutation.state;
    } catch (error) {
      showToast(error.message);
    } finally {
      checking = false;
      renderAll();
    }
  }

  async function saveReflectionAndMaybeComplete(challengeId, reflectionText) {
    const challenge = Challenges.byId[challengeId];
    const currentRec = getRecord(challengeId);
    const currentSource = currentRec.fileName ? AtelierAPI.getFileSource(currentRec.fileName) : null;
    const validReflection = nonWhitespaceLength(reflectionText) >= 30;

    try {
      const result = await Store.mutate(draft => {
        const rec = draft.challenges[challengeId] || defaultRecord();
        rec.reflection = reflectionText;

        if (rec.status === 'completed') {
          draft.challenges[challengeId] = rec;
          return { completed: true, alreadyCompleted: true };
        }

        const passed = rec.lastCheck?.outcome === 'passed';
        const sameSource = passed && typeof currentSource === 'string' && currentSource === rec.lastCheck.sourceSnapshot;

        if (passed && !sameSource) {
          rec.status = 'in_progress';
          rec.lastCheck = { ...rec.lastCheck, stale: true };
        }

        if (!validReflection || !passed || !sameSource) {
          draft.challenges[challengeId] = rec;
          return { completed: false, validReflection, passed, sameSource };
        }

        const completedAt = now();
        rec.status = 'completed';
        rec.completedAt = completedAt;
        rec.completedSnapshot = {
          challengeId,
          challengeDefinitionVersion: challenge.definitionVersion,
          checkedSource: rec.lastCheck.sourceSnapshot,
          checkedSourceHash: rec.lastCheck.sourceHash,
          passingCheckResult: {
            outcome: 'passed',
            attemptId: rec.lastCheck.attemptId,
            casesPassed: rec.lastCheck.casesPassed,
            casesTotal: rec.lastCheck.casesTotal
          },
          passingCheckTimestamp: rec.lastCheck.checkedAt,
          completionTimestamp: completedAt,
          learnerSubmittedReflection: reflectionText
        };

        Store.appendEvent(draft, Store.rewardEvent(challengeId, 'completion', completedAt));
        Store.appendEvent(draft, Store.rewardEvent(challengeId, 'reflection', completedAt));

        if (rec.pendingDebugRecovery?.meaningfulChangeResult === 'token_change') {
          Store.appendEvent(draft, Store.rewardEvent(challengeId, 'debug-recovery', completedAt, {
            recovery: { ...rec.pendingDebugRecovery }
          }));
        }
        draft.challenges[challengeId] = rec;
        return { completed: true, alreadyCompleted: false };
      });
      state = result.state;
      if (result.result.completed && !result.result.alreadyCompleted) showToast('Challenge completed. Seeds added to your learning record.');
      else if (!result.result.completed) {
        if (!result.result.validReflection) showToast('Reflection needs at least 30 non-whitespace characters.');
        else if (!result.result.passed) showToast('Pass Check My Work before completing this challenge.');
        else if (!result.result.sameSource) showToast('The source changed after the passing check. Check the current code again.');
      } else showToast('Reflection saved. Completion rewards remain once-only.');
      renderAll();
    } catch (error) {
      showToast(error.message);
    }
  }

  function renderGarden() {
    if (!roots.garden) return;
    if (stateError) return showLearningError(roots.garden, stateError.message);
    const t = totals();
    const stage = gardenStage(t.totalSeedsInvested);
    roots.garden.innerHTML = '<div class="learning-shell">' +
      '<div class="learning-head"><div><div class="learning-kicker">Atelier Garden</div><h1>Grow what you practice.</h1><p>Seeds come from meaningful challenge work. Investing them changes the Garden, never your historical learning record.</p></div></div>' +
      '<div class="seed-summary"><div class="seed-stat"><strong>' + t.seedBalance + '</strong><span>Seed Balance</span></div><div class="seed-stat"><strong>' + t.totalSeedsInvested + '</strong><span>Total Seeds Invested</span></div><div class="seed-stat"><strong>' + t.totalSeedsEarned + '</strong><span>Total Seeds Earned</span></div></div>' +
      '<div class="garden-layout"><div class="garden-card"><div class="garden-stage">' + gardenSVG(stage.key) + '</div></div>' +
      '<aside class="garden-card"><div class="learning-kicker">Current growth</div><div class="garden-stage-label">' + stage.label + '</div><p class="garden-copy">' + stage.copy + '</p>' +
      '<div class="garden-controls"><button type="button" data-invest="1" ' + (gardenSaving || t.seedBalance < 1 ? 'disabled' : '') + '>Invest 1 Seed</button><button type="button" data-invest="5" ' + (gardenSaving || t.seedBalance < 5 ? 'disabled' : '') + '>Invest 5 Seeds</button><button type="button" data-invest="all" ' + (gardenSaving || t.seedBalance < 1 ? 'disabled' : '') + '>Invest All (' + t.seedBalance + ')</button></div>' +
      (gardenPendingTx ? '<div class="learning-note" style="margin-top:10px">A previous investment action is pending confirmation. Retrying the same amount reuses its transaction ID.</div>' : '') +
      '<div class="learning-note" style="margin-top:10px">Garden growth is optional. Challenge completion and your Practice Record do not depend on Garden stage.</div></aside></div></div>';
    roots.garden.querySelectorAll('[data-invest]').forEach(button => button.onclick = () => {
      const amount = button.dataset.invest === 'all' ? totals().seedBalance : Number(button.dataset.invest);
      investSeeds(amount);
    });
  }

  function gardenStage(invested) {
    if (invested >= 30) return { key: 'fruiting', label: 'Fruiting Tree', copy: 'The tree now carries visible pomegranates—growth funded by Seeds already earned through practice.' };
    if (invested >= 20) return { key: 'flowering', label: 'Flowering Tree', copy: 'Flowers mark a mature stage of investment without changing your learning history.' };
    if (invested >= 10) return { key: 'young-tree', label: 'Young Tree', copy: 'The trunk and branches are established. Keep investing earned Seeds when you choose.' };
    if (invested >= 5) return { key: 'sapling', label: 'Sapling', copy: 'The sprout has become a small, stable plant.' };
    if (invested >= 1) return { key: 'sprout', label: 'Sprout', copy: 'Your first invested Seed has broken the surface.' };
    return { key: 'seed', label: 'Seed', copy: 'Earn Seeds through completed learning work, then choose whether to invest them here.' };
  }

  function gardenSVG(stage) {
    const show = level => {
      const order = ['seed','sprout','sapling','young-tree','flowering','fruiting'];
      return order.indexOf(stage) >= order.indexOf(level);
    };
    return '<svg class="garden-grow" viewBox="0 0 420 360" role="img" aria-label="Pomegranate garden stage: ' + escapeHTML(gardenStage(totals().totalSeedsInvested).label) + '">' +
      '<ellipse class="garden-ground" cx="210" cy="325" rx="150" ry="24"/>' +
      (stage === 'seed' ? '<ellipse class="garden-seed" cx="210" cy="304" rx="10" ry="15"/>' : '') +
      (show('sprout') ? '<path class="garden-stem" d="M210 314 Q210 275 210 246"/><ellipse class="garden-leaf" cx="190" cy="268" rx="22" ry="10" transform="rotate(-28 190 268)"/><ellipse class="garden-leaf" cx="230" cy="252" rx="22" ry="10" transform="rotate(28 230 252)"/>' : '') +
      (show('sapling') ? '<path class="garden-stem" d="M210 300 Q205 235 210 170"/><path class="garden-branch" d="M210 218 Q170 200 145 175"/><path class="garden-branch" d="M210 205 Q250 190 275 160"/><ellipse class="garden-leaf" cx="145" cy="173" rx="28" ry="12" transform="rotate(25 145 173)"/><ellipse class="garden-leaf" cx="278" cy="158" rx="28" ry="12" transform="rotate(-28 278 158)"/>' : '') +
      (show('young-tree') ? '<path class="garden-stem" d="M210 300 Q196 210 210 95"/><path class="garden-branch" d="M205 190 Q145 165 108 128"/><path class="garden-branch" d="M210 175 Q276 155 316 116"/><path class="garden-branch" d="M210 140 Q168 115 150 84"/><path class="garden-branch" d="M214 140 Q250 110 270 78"/><ellipse class="garden-leaf" cx="105" cy="125" rx="34" ry="14" transform="rotate(24 105 125)"/><ellipse class="garden-leaf" cx="318" cy="113" rx="34" ry="14" transform="rotate(-24 318 113)"/><ellipse class="garden-leaf" cx="146" cy="82" rx="31" ry="13" transform="rotate(32 146 82)"/><ellipse class="garden-leaf" cx="274" cy="76" rx="31" ry="13" transform="rotate(-32 274 76)"/>' : '') +
      (show('flowering') ? '<g class="garden-flower"><circle cx="108" cy="128" r="9"/><circle cx="150" cy="84" r="9"/><circle cx="270" cy="80" r="9"/><circle cx="316" cy="118" r="9"/></g>' : '') +
      (show('fruiting') ? '<g><circle class="garden-fruit" cx="118" cy="142" r="19"/><circle class="garden-fruit" cx="164" cy="105" r="20"/><circle class="garden-fruit" cx="260" cy="104" r="20"/><circle class="garden-fruit" cx="305" cy="140" r="19"/></g>' : '') +
      '</svg>';
  }

  async function investSeeds(amount) {
    if (gardenSaving || !Number.isInteger(amount) || amount <= 0) return;
    const transactionId = gardenPendingTx?.amount === amount
      ? gardenPendingTx.id
      : 'garden-investment:' + Store.uid('tx').split(':').slice(1).join(':');
    gardenPendingTx = { id: transactionId, amount };
    gardenSaving = true;
    renderGarden();
    try {
      const result = await Store.mutate(draft => {
        if (Store.eventExists(draft, transactionId)) return { duplicate: true };
        const t = Store.deriveSeedTotals(draft.seedLedger);
        if (amount > t.seedBalance) throw new Error('Not enough Seeds for that Garden investment.');
        Store.appendEvent(draft, Store.gardenEvent(amount, transactionId));
        return { duplicate: false };
      });
      state = result.state;
      gardenPendingTx = null;
      showToast(result.result.duplicate ? 'That investment was already recorded.' : 'Seeds invested in the Atelier Garden.');
    } catch (error) {
      refreshState();
      if (Store.eventExists(state, transactionId)) {
        gardenPendingTx = null;
        showToast('Investment confirmed after refresh.');
      } else {
        showToast(error.message + ' Retry the same amount to reuse this transaction.');
      }
    } finally {
      gardenSaving = false;
      renderAll();
    }
  }

  function renderRecord() {
    if (!roots.record) return;
    if (stateError) return showLearningError(roots.record, stateError.message);
    const t = totals();
    const done = completedCount();
    let html = '<div class="learning-shell">' +
      '<div class="learning-head"><div><div class="learning-kicker">Practice Record</div><h1>Your local learning history.</h1><p>Challenge completion, self-check state, learner-submitted reflection, and Seed accounting remain separate from Garden appearance.</p></div></div>' +
      '<div class="learning-note">This Practice Record is self-reported local data stored in your browser. It is not externally authenticated, tamper-proof, or a credential. Local browser data can be edited or cleared; use Backup to keep a copy.</div>' +
      '<div class="progress-wrap"><div class="progress-track"><div class="progress-fill" style="width:' + (done / Challenges.challenges.length * 100) + '%"></div></div><div class="progress-label"><span>CS50P Foundations</span><span>' + done + ' of ' + Challenges.challenges.length + ' challenges completed</span></div></div>' +
      '<div class="seed-summary"><div class="seed-stat"><strong>' + t.totalSeedsEarned + '</strong><span>Total Seeds Earned</span></div><div class="seed-stat"><strong>' + t.seedBalance + '</strong><span>Current Seed Balance</span></div><div class="seed-stat"><strong>' + t.totalSeedsInvested + '</strong><span>Total Seeds Invested</span></div></div>' +
      '<div class="backupbar"><button type="button" id="exportLearning">Export Learning Backup</button><label><button type="button" id="chooseImport">Import Backup</button><input type="file" id="importLearning" accept="application/json,.json"></label></div>' +
      '<div class="learning-note">Version 1 import restores only into an empty learning store. It refuses to merge into an existing record.</div>' +
      '<div class="record-list">';

    for (const challenge of Challenges.challenges) {
      const rec = getRecord(challenge.id);
      const currentSource = rec.fileName ? window.AtelierAPI?.getFileSource?.(rec.fileName) : null;
      const checkIsStale = rec.lastCheck?.outcome === 'passed' && typeof currentSource === 'string' && currentSource !== rec.lastCheck.sourceSnapshot;
      const lastLabel = !rec.fileName
        ? (rec.completedSnapshot ? 'Current work unavailable' : 'Not checked')
        : checkIsStale
          ? 'Current code changed since last check'
          : rec.lastCheck
            ? (rec.lastCheck.outcome === 'passed' ? 'Self-Check Passed' : rec.lastCheck.outcome === 'needs_revision' ? 'Needs Revision' : 'Check inconclusive')
            : 'Not checked';
      html += '<article class="record-card"><div class="record-head"><div><h3>' + escapeHTML(challenge.title) + '</h3><div class="record-meta">Current code: ' + escapeHTML(lastLabel) + (rec.completedAt ? ' · Completed ' + escapeHTML(new Date(rec.completedAt).toLocaleString()) : '') + '</div></div>' + statusPill(rec.status) + '</div>' +
        (rec.reflection ? '<div class="record-reflection"><strong>Learner-submitted reflection</strong><br>' + escapeHTML(rec.reflection) + '</div>' : '') +
        '<div class="learning-actions" style="margin-top:9px">' +
        (rec.fileName ? '<button type="button" class="quiet" data-record-reopen="' + challenge.id + '">Reopen Current Work</button>' : '') +
        (rec.completedSnapshot ? '<details class="snapshot"><summary>View Completed Snapshot</summary><pre>' + escapeHTML(rec.completedSnapshot.checkedSource) + '</pre></details>' : '') +
        '</div></article>';
    }
    html += '</div></div>';
    roots.record.innerHTML = html;
    roots.record.querySelectorAll('[data-record-reopen]').forEach(button => button.onclick = () => openChallengeWork(button.dataset.recordReopen, true));
    $('exportLearning').onclick = exportLearningBackup;
    $('chooseImport').onclick = () => $('importLearning').click();
    $('importLearning').onchange = event => importLearningBackup(event.target.files?.[0]);
  }

  function exportLearningBackup() {
    try {
      const backup = Store.createBackup(state);
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'python-atelier-learning-backup-' + new Date().toISOString().slice(0, 10) + '.json';
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      showToast('Learning backup exported.');
    } catch (error) {
      showToast(error.message);
    }
  }

  async function importLearningBackup(file) {
    const input = $('importLearning');
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const imported = Store.validateBackup(parsed);
      const importedTotals = Store.deriveSeedTotals(imported.seedLedger);
      if (!Store.isEmpty(state)) throw new Error('Import refused: Version 1 restores only into an empty learning store.');
      const summary = 'Restore ' + Object.keys(imported.challenges).length + ' challenge record(s), ' + imported.seedLedger.length + ' Seed event(s), and a Seed balance of ' + importedTotals.seedBalance + '? Imported code is stored only as snapshot text and will not be executed.';
      if (!confirm(summary)) return;
      const result = await Store.importIntoEmpty(parsed);
      state = result.state;
      showToast('Learning backup restored.');
      renderAll();
    } catch (error) {
      showToast('Import not applied: ' + error.message);
    } finally {
      if (input) input.value = '';
    }
  }

  async function handleRename(event) {
    const { oldName, newName } = event.detail || {};
    if (!oldName || !newName || stateError) return;
    try {
      const result = await Store.mutate(draft => {
        for (const rec of Object.values(draft.challenges)) if (rec.fileName === oldName) rec.fileName = newName;
      });
      state = result.state;
      renderAll();
    } catch (error) { showToast(error.message); }
  }

  async function handleDelete(event) {
    const { fileName } = event.detail || {};
    if (!fileName || stateError) return;
    try {
      const result = await Store.mutate(draft => {
        for (const rec of Object.values(draft.challenges)) if (rec.fileName === fileName) rec.fileName = null;
      });
      state = result.state;
      renderAll();
    } catch (error) { showToast(error.message); }
  }

  document.querySelectorAll('[data-product-view]').forEach(button => {
    button.addEventListener('click', () => setProductView(button.dataset.productView));
  });
  window.addEventListener('atelier:file-renamed', handleRename);
  window.addEventListener('atelier:file-deleted', handleDelete);
  window.addEventListener('atelier:runtime-status', () => { if (activeChallengeId) renderPractice(); });
  window.addEventListener('storage', event => { if (event.key === Store.STORAGE_KEY) refreshState(); });
  window.addEventListener('focus', refreshState);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refreshState(); });

  try {
    state = Store.readState();
  } catch (error) {
    state = Store.emptyState();
    stateError = error;
  }
  renderAll();
  const requested = location.hash.replace('#', '');
  setProductView(['practice','garden','record','workbench'].includes(requested) ? requested : 'workbench');
})();