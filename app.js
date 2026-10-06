/* Portfolio interactions. Every feature degrades to plain static content without JavaScript. */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function store(key, value) {
    try {
      if (value === undefined) return localStorage.getItem(key);
      localStorage.setItem(key, value);
    } catch (e) {
      return null;
    }
    return null;
  }

  /* ---------- Theme ---------- */
  function currentTheme() {
    var set = root.getAttribute('data-theme');
    if (set) return set;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function initTheme() {
    var btn = document.querySelector('.theme-toggle');
    if (!btn) return;
    function label() {
      var next = currentTheme() === 'dark' ? 'light' : 'dark';
      btn.setAttribute('aria-label', 'Switch to ' + next + ' theme');
      btn.setAttribute('title', 'Switch to ' + next + ' theme');
    }
    btn.addEventListener('click', function () {
      var next = currentTheme() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      store('jv-theme', next);
      label();
    });
    label();
  }

  /* ---------- Section nav ---------- */
  function initNav() {
    var links = Array.prototype.slice.call(document.querySelectorAll('.nav-links a'));
    if (!links.length || !('IntersectionObserver' in window)) return;
    var byId = {};
    links.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (a) { a.removeAttribute('aria-current'); });
        var link = byId[entry.target.id];
        if (link) link.setAttribute('aria-current', 'true');
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    Object.keys(byId).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) observer.observe(el);
    });
  }

  /* ---------- Pipeline stages (tabs) ---------- */
  function initStages() {
    var tabs = Array.prototype.slice.call(document.querySelectorAll('.stage[role="tab"]'));
    if (!tabs.length) return;
    var panels = tabs.map(function (t) { return document.getElementById(t.getAttribute('aria-controls')); });

    function select(index, focus) {
      tabs.forEach(function (tab, i) {
        var on = i === index;
        tab.setAttribute('aria-selected', on ? 'true' : 'false');
        tab.tabIndex = on ? 0 : -1;
        if (on) {
          panels[i].hidden = false;
          panels[i].classList.remove('is-entering');
          void panels[i].offsetWidth;
          panels[i].classList.add('is-entering');
        } else {
          panels[i].hidden = true;
        }
      });
      if (focus) tabs[index].focus();
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { select(i, false); });
      tab.addEventListener('keydown', function (e) {
        var next = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (i + 1) % tabs.length;
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (i - 1 + tabs.length) % tabs.length;
        if (e.key === 'Home') next = 0;
        if (e.key === 'End') next = tabs.length - 1;
        if (next !== null) {
          e.preventDefault();
          select(next, true);
        }
      });
    });

    var start = 0;
    var hash = window.location.hash.match(/^#stage-([1-6])$/);
    if (hash) start = Number(hash[1]) - 1;
    select(start, false);
    panels.forEach(function (p) { p.classList.remove('is-entering'); });
  }

  /* ---------- Copy and verification replay ---------- */
  function initVerify() {
    document.querySelectorAll('[data-copy]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var source = document.getElementById(btn.getAttribute('data-copy'));
        if (!source) return;
        var text = source.textContent;
        var done = function (ok) {
          var original = btn.getAttribute('data-label') || btn.textContent;
          btn.setAttribute('data-label', original);
          btn.textContent = ok ? 'Copied' : 'Select and copy manually';
          setTimeout(function () { btn.textContent = original; }, 2000);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); });
        } else {
          done(false);
        }
      });
    });

    var replay = document.querySelector('[data-replay]');
    var out = document.querySelector('.terminal-out');
    if (!replay || !out) return;

    var script = [
      { text: '$ bash ../verify-evidence.sh evidence-bundle.tar.gz', cls: 't-cmd', wait: 250 },
      { text: 'Checking integrity...', wait: 450 },
      { text: 'evidence-bundle.tar.gz: OK', cls: 't-ok', wait: 650 },
      { text: 'Checking authenticity...', wait: 450 },
      { text: 'Verified OK', cls: 't-ok', wait: 900 },
      { text: 'CHAIN INTACT', cls: 't-final', wait: 350 }
    ];

    replay.addEventListener('click', function () {
      out.hidden = false;
      out.textContent = '';
      replay.disabled = true;
      replay.textContent = 'Replaying';
      var i = 0;
      function line() {
        if (i >= script.length) {
          replay.disabled = false;
          replay.textContent = 'Replay again';
          return;
        }
        var step = script[i];
        var span = document.createElement('span');
        if (step.cls) span.className = step.cls;
        span.textContent = step.text;
        out.appendChild(span);
        out.appendChild(document.createTextNode('\n'));
        i += 1;
        if (reduceMotion) line();
        else setTimeout(line, step.wait);
      }
      line();
    });
  }

  /* ---------- Toolkit filter ---------- */
  function initFilters() {
    var chips = Array.prototype.slice.call(document.querySelectorAll('.chip[data-filter]'));
    var items = Array.prototype.slice.call(document.querySelectorAll('.tools li[data-group]'));
    var status = document.querySelector('.filter-status');
    if (!chips.length) return;
    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        var group = chip.getAttribute('data-filter');
        chips.forEach(function (c) { c.setAttribute('aria-pressed', c === chip ? 'true' : 'false'); });
        var shown = 0;
        items.forEach(function (li) {
          var match = group === 'all' || li.getAttribute('data-group') === group;
          li.hidden = !match;
          if (match) shown += 1;
        });
        if (status) {
          status.textContent = group === 'all'
            ? 'Showing all ' + items.length + ' tools'
            : 'Showing ' + shown + ' of ' + items.length + ' tools: ' + chip.textContent.toLowerCase();
        }
      });
    });
  }

  /* ---------- Live GitHub activity ---------- */
  var GH_USER = 'johnnyvaughanii-cyber';
  var GH_REPOS = ['grc-pipeline', 'it-audit-toolkit', 'GRC-Automation', 'uar-agent', 'portfolio-site'];
  var CACHE_KEY = 'jv-gh-commits-v2';
  var CACHE_MS = 30 * 60 * 1000;

  function relativeTime(date) {
    var seconds = (date.getTime() - Date.now()) / 1000;
    var units = [
      ['year', 31536000], ['month', 2592000], ['week', 604800],
      ['day', 86400], ['hour', 3600], ['minute', 60]
    ];
    var fmt = ('Intl' in window && Intl.RelativeTimeFormat)
      ? new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
      : null;
    for (var i = 0; i < units.length; i += 1) {
      var size = units[i][1];
      if (Math.abs(seconds) >= size || units[i][0] === 'minute') {
        var value = Math.round(seconds / size);
        if (units[i][0] === 'minute' && Math.abs(value) < 1) return 'just now';
        return fmt ? fmt.format(value, units[i][0]) : Math.abs(value) + ' ' + units[i][0] + 's ago';
      }
    }
    return '';
  }

  function absoluteDate(date) {
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  function timeEl(date) {
    var t = document.createElement('time');
    t.dateTime = date.toISOString();
    t.title = absoluteDate(date);
    t.textContent = relativeTime(date);
    return t;
  }

  function firstLine(message) {
    return String(message || '').split('\n')[0].trim();
  }

  function fetchRepo(repo) {
    var url = 'https://api.github.com/repos/' + GH_USER + '/' + repo + '/commits?per_page=5';
    return fetch(url, { headers: { Accept: 'application/vnd.github+json' } }).then(function (res) {
      if (!res.ok) throw new Error('GitHub returned ' + res.status + ' for ' + repo);
      return res.json();
    }).then(function (list) {
      return list.map(function (c) {
        return {
          repo: repo,
          sha: c.sha,
          url: c.html_url,
          message: firstLine(c.commit && c.commit.message),
          date: (c.commit && c.commit.author && c.commit.author.date) || (c.commit && c.commit.committer && c.commit.committer.date)
        };
      });
    });
  }

  function loadCommits() {
    var cached = null;
    try { cached = JSON.parse(store(CACHE_KEY) || 'null'); } catch (e) { cached = null; }
    if (cached && cached.savedAt && Date.now() - cached.savedAt < CACHE_MS && cached.commits) {
      return Promise.resolve(cached.commits);
    }
    return Promise.all(GH_REPOS.map(function (repo) {
      return fetchRepo(repo).catch(function () { return null; });
    })).then(function (results) {
      var ok = results.filter(Boolean);
      if (!ok.length) throw new Error('GitHub activity unavailable');
      var commits = [].concat.apply([], ok);
      store(CACHE_KEY, JSON.stringify({ savedAt: Date.now(), commits: commits }));
      return commits;
    });
  }

  function commitLink(c) {
    var a = document.createElement('a');
    a.href = c.url;
    a.textContent = c.message;
    return a;
  }

  function renderLive(commits) {
    var meaningful = commits.filter(function (c) { return c.message && !/^Merge (pull request|branch)/.test(c.message); });
    meaningful.sort(function (a, b) { return new Date(b.date) - new Date(a.date); });

    document.querySelectorAll('[data-live]').forEach(function (el) {
      var key = el.getAttribute('data-live');
      var latest = key === 'latest'
        ? meaningful[0]
        : meaningful.filter(function (c) { return c.repo === key; })[0];
      if (!latest) return;
      var span = document.createElement('span');
      span.appendChild(document.createTextNode(key === 'latest' ? 'Latest commit ' : 'Last commit '));
      span.appendChild(timeEl(new Date(latest.date)));
      if (key === 'latest') span.appendChild(document.createTextNode(' in ' + latest.repo));
      span.appendChild(document.createTextNode(': '));
      span.appendChild(commitLink(latest));
      el.textContent = '';
      el.appendChild(span);
      el.hidden = false;
    });

    var list = document.querySelector('[data-commits]');
    if (!list) return;
    list.textContent = '';
    var perRepo = {};
    var feed = meaningful.filter(function (c) {
      perRepo[c.repo] = (perRepo[c.repo] || 0) + 1;
      return perRepo[c.repo] <= 2;
    });
    feed.slice(0, 6).forEach(function (c) {
      var li = document.createElement('li');
      li.appendChild(timeEl(new Date(c.date)));
      var repo = document.createElement('span');
      repo.className = 'repo';
      repo.textContent = c.repo;
      li.appendChild(repo);
      var msg = document.createElement('span');
      msg.className = 'msg';
      msg.appendChild(commitLink(c));
      li.appendChild(msg);
      list.appendChild(li);
    });
  }

  function renderFailure() {
    var list = document.querySelector('[data-commits]');
    if (!list) return;
    list.textContent = '';
    var li = document.createElement('li');
    li.className = 'commits-status';
    li.appendChild(document.createTextNode("GitHub activity didn't load. GitHub limits how often a browser can request it, so try again later or "));
    var a = document.createElement('a');
    a.href = 'https://github.com/' + GH_USER + '?tab=repositories';
    a.textContent = 'browse the repositories on GitHub';
    li.appendChild(a);
    li.appendChild(document.createTextNode('.'));
    list.appendChild(li);
  }

  function initActivity() {
    if (!window.fetch || !window.Promise) { renderFailure(); return; }
    loadCommits().then(renderLive, renderFailure);
  }

  initTheme();
  initNav();
  initStages();
  initVerify();
  initFilters();
  initActivity();
})();
