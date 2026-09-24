// JetShift engine - jet lag shift planning (no DOM)
(function (root) {
  'use strict';

  var RATE_MIN = 60;      // shift per day, minutes
  var MAX_PRE_DAYS = 5;   // cap pre-travel shifting

  // UTC offset of an IANA zone at a given date, in minutes east of UTC.
  function offsetMinutes(tz, date) {
    var d = new Date(date);
    var str = d.toLocaleString('en-US', { timeZone: tz, hour12: false,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit' });
    var asLocal = new Date(str);
    // asLocal is parsed in the host zone, so the diff is (tz offset - host offset). Add host offset back.
    return Math.round((asLocal.getTime() - d.getTime()) / 60000) - d.getTimezoneOffset();
  }

  // Signed body-clock shift in minutes, normalized to the shorter direction (-720..720).
  // Positive = advance (eastward), negative = delay (westward).
  function shiftMinutes(originTz, destTz, date) {
    var diff = offsetMinutes(destTz, date) - offsetMinutes(originTz, date);
    if (diff > 720) diff -= 1440;
    if (diff < -720) diff += 1440;
    return diff;
  }

  function direction(shiftMin) {
    if (shiftMin > 0) return 'advance';
    if (shiftMin < 0) return 'delay';
    return 'none';
  }

  function daysNeeded(shiftMin, rateMin) {
    var r = rateMin || RATE_MIN;
    return Math.ceil(Math.abs(shiftMin) / r);
  }

  function clampMin(m) { return ((Math.round(m) % 1440) + 1440) % 1440; }

  function fmt(minutesOfDay) {
    var m = clampMin(minutesOfDay);
    var h = Math.floor(m / 60), mm = m % 60;
    var ap = h >= 12 ? 'PM' : 'AM';
    var hh = h % 12; if (hh === 0) hh = 12;
    return hh + ':' + String(mm).padStart(2, '0') + ' ' + ap;
  }

  // Light advice for one plan day.
  function lightFor(dir, targetWakeMin) {
    if (dir === 'advance') {
      return { seek: 'bright light in the morning (' + fmt(targetWakeMin) + ' - ' + fmt(targetWakeMin + 180) + ')',
               avoid: 'bright light in the late evening' };
    }
    if (dir === 'delay') {
      return { seek: 'bright light in the evening (' + fmt(clampMin(targetWakeMin + 720)) + ' onwards)',
               avoid: 'bright light early in the morning' };
    }
    return { seek: 'usual daylight', avoid: 'nothing special' };
  }

  // Build the full plan.
  // shiftMin signed; wakeMin/bedMin usual home times; departInDays 0..MAX_PRE_DAYS.
  function buildPlan(shiftMin, wakeMin, bedMin, departInDays) {
    var dir = direction(shiftMin);
    if (dir === 'none') {
      return { direction: 'none', shiftMin: 0, pre: [], post: [], note: 'same time zone - no shift needed' };
    }
    var sign = dir === 'advance' ? 1 : -1;
    var total = Math.abs(shiftMin);
    var preDays = Math.min(Math.max(0, departInDays | 0), MAX_PRE_DAYS, daysNeeded(total));
    var moved = 0;
    var pre = [];
    for (var i = 1; i <= preDays; i++) {
      var step = Math.min(RATE_MIN, total - moved);
      moved += step;
      var w = clampMin(wakeMin + sign * moved);
      var b = clampMin(bedMin + sign * moved);
      pre.push({ day: i, when: 'day ' + i + ' before departure', wake: w, bed: b,
                 shifted: moved, light: lightFor(dir, w) });
    }
    var post = [];
    var left = total - moved;
    var day = 0;
    while (left > 0) {
      day += 1;
      var step2 = Math.min(RATE_MIN, left);
      moved += step2; left -= step2;
      var w2 = clampMin(wakeMin + sign * moved);
      var b2 = clampMin(bedMin + sign * moved);
      post.push({ day: day, when: day === 1 ? 'arrival day' : 'day ' + day + ' after arrival',
                  wake: w2, bed: b2, shifted: moved, light: lightFor(dir, w2) });
    }
    return {
      direction: dir, shiftMin: shiftMin, totalMin: total, rateMin: RATE_MIN,
      pre: pre, post: post,
      daysTotal: pre.length + post.length,
      caffeineCutoff: clampMin((pre.length ? pre[pre.length - 1].bed : bedMin) - 8 * 60),
      napRule: 'arrival day: nap max 20-30 min, never after 3 PM local'
    };
  }

  var api = { RATE_MIN: RATE_MIN, MAX_PRE_DAYS: MAX_PRE_DAYS, offsetMinutes: offsetMinutes,
    shiftMinutes: shiftMinutes, direction: direction, daysNeeded: daysNeeded,
    clampMin: clampMin, fmt: fmt, lightFor: lightFor, buildPlan: buildPlan };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.JetEngine = api;
})(typeof self !== 'undefined' ? self : this);
