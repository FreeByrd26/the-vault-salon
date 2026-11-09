/* K-Tip agreement: live quote, fill the official PDF in the browser,
   download a client copy, and email the signed PDF to The Vault via FormSubmit. */
(function () {
  var form = document.getElementById('ktip-form');
  if (!form) return;
  var RATES = { Nicole: 500, Olivia: 375 };
  var HAIR = 15, DEPOSIT = 1500;
  // Completed agreements are emailed here via FormSubmit (first submission sends an activation email).
  var SEND_TO = 'https://formsubmit.co/nicole@thevaultnewcanaan.com';
  var $ = function (id) { return document.getElementById(id); };
  var money = function (n) { return '$' + Math.round(n).toLocaleString('en-US'); };
  var num = function (v) { var n = parseFloat(String(v).replace(/[^0-9.]/g, '')); return isNaN(n) ? 0 : n; };

  function quote() {
    var artist = $('artist').value, rate = RATES[artist] || 0;
    var hrs = num($('labor_hours').value), g = num($('hair_grams').value);
    var labor = rate * hrs, hair = g * HAIR, total = labor + hair;
    $('rate_cell').textContent = rate ? money(rate) + ' / hour' : 'Select artist';
    $('labor_amount_cell').textContent = rate ? money(labor) : '\u2014';
    $('hair_amount_cell').textContent = money(hair);
    $('total_cell').textContent = rate ? money(total) : '\u2014';
    $('balance_cell').textContent = rate ? money(Math.max(total - DEPOSIT, 0)) : '\u2014';
    return { rate: rate, hrs: hrs, g: g, labor: labor, hair: hair, total: total };
  }
  ['artist', 'labor_hours', 'hair_grams'].forEach(function (id) {
    $(id).addEventListener('input', quote); $(id).addEventListener('change', quote);
  });
  quote();

  // keep printed name in step with full name until edited
  var printedTouched = false;
  $('printed_name').addEventListener('input', function () { printedTouched = true; });
  $('full_name').addEventListener('input', function () { if (!printedTouched) $('printed_name').value = this.value; });
  if (!$('client_date').value) { var d = new Date(); $('client_date').value = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }

  function fmtDate(v) { if (!v) return ''; var p = v.split('-'); return p.length === 3 ? p[1] + '/' + p[2] + '/' + p[0] : v; }
  function fmtDateTime(v) {
    if (!v) return ''; var dt = new Date(v); if (isNaN(dt)) return v;
    return dt.toLocaleDateString('en-US') + ' ' + dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }
  var status = $('form-status');
  function setStatus(msg, err) { status.textContent = msg; status.className = 'form-status' + (err ? ' err' : ''); }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    var missing = [];
    form.querySelectorAll('[required]').forEach(function (el) {
      var bad = !String(el.value).trim() || (el.type === 'email' && !/^\S+@\S+\.\S+$/.test(el.value));
      el.classList.toggle('invalid', bad);
      if (bad) missing.push(el);
    });
    if (!$('artist').value) { missing.push($('artist')); $('artist').classList.add('invalid'); } else $('artist').classList.remove('invalid');
    if (missing.length) {
      setStatus('Please complete the highlighted fields (' + missing.length + ' remaining), including every set of initials and your signature.', true);
      missing[0].focus(); return;
    }
    if (!window.PDFLib) { setStatus('The PDF tool did not load. Please check your connection, or download the fillable PDF above.', true); return; }
    setStatus('Preparing your agreement\u2026');
    try {
      var q = quote();
      var bytes = await fetch('forms/KTip-Deposit-Agreement.pdf').then(function (r) { if (!r.ok) throw new Error('fetch'); return r.arrayBuffer(); });
      var pdf = await PDFLib.PDFDocument.load(bytes);
      var f = pdf.getForm();
      var v = function (id) { var el = form.elements[id]; return el ? String(el.value).trim() : ''; };
      var ini = v('initials_quote').toUpperCase();
      var data = {
        full_name: v('full_name'), phone: v('phone'), email: v('email'),
        consultation_date: fmtDate(v('consultation_date')), install_datetime: fmtDateTime(v('install_datetime')),
        artist: v('artist'), photos_taken: v('photos_taken'), length_inches: v('length_inches'),
        color_shade: v('color_shade'), color_service_booked: v('color_service_booked'),
        labor_rate: money(q.rate) + '/hr', labor_hours: String(q.hrs), labor_amount: money(q.labor),
        hair_grams: String(q.g), hair_amount: money(q.hair), estimated_total: money(q.total),
        accepted_payment: v('accepted_payment'),
        client_signature: v('client_signature'), client_date: fmtDate(v('client_date')), printed_name: v('printed_name'),
        footer_initials_p1: ini, footer_initials_p2: ini, footer_initials_p3: ini, footer_initials_p4: ini
      };
      ['initials_quote', 'initials_deposit', 'initials_cancellation_policy', 'ack_initials_1', 'ack_initials_2', 'ack_initials_3',
       'ack_initials_4', 'ack_initials_5', 'ack_initials_6', 'ack_initials_7'].forEach(function (k) { data[k] = v(k).toUpperCase(); });
      Object.keys(data).forEach(function (k) { try { f.getTextField(k).setText(data[k]); } catch (err) { /* field missing */ } });
      var out = await pdf.save();
      var safe = (v('full_name') || 'Client').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '');
      var fname = 'KTip-Agreement-' + safe + '.pdf';
      var blob = new Blob([out], { type: 'application/pdf' });

      // 1) client copy
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url; a.download = fname;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 4000);

      // 2) email to The Vault (FormSubmit, multipart with PDF attached)
      if (form.elements._honey && form.elements._honey.value) return;
      var post = document.createElement('form');
      post.method = 'POST'; post.action = SEND_TO; post.enctype = 'multipart/form-data'; post.style.display = 'none';
      var add = function (n, val) { var i = document.createElement('input'); i.type = 'hidden'; i.name = n; i.value = val; post.appendChild(i); };
      add('_subject', 'K-Tip Agreement signed: ' + v('full_name'));
      add('_template', 'table');
      add('_next', new URL('thank-you.html', location.href).href);
      add('email', v('email'));
      add('Client name', v('full_name'));
      add('Phone', v('phone'));
      add('Artist', v('artist'));
      add('Install appointment', data.install_datetime || 'Not yet scheduled');
      add('Color service booked', v('color_service_booked') || '-');
      add('Estimate', money(q.total) + ' (' + q.hrs + ' hrs labor ' + money(q.labor) + ' + ' + q.g + ' g hair ' + money(q.hair) + ')');
      add('Deposit payment method', v('accepted_payment') || '-');
      add('Signed', v('client_signature') + ' on ' + data.client_date);
      var attached = false;
      try {
        var file = new File([blob], fname, { type: 'application/pdf' });
        var dt = new DataTransfer(); dt.items.add(file);
        var fi = document.createElement('input'); fi.type = 'file'; fi.name = 'attachment'; fi.files = dt.files;
        post.appendChild(fi); attached = fi.files && fi.files.length === 1;
      } catch (err) { attached = false; }
      if (!attached) add('Note', 'This browser could not attach the PDF. The client was asked to email their downloaded copy.');
      document.body.appendChild(post);
      setStatus(attached ? 'A copy has downloaded. Sending your agreement to The Vault\u2026' :
        'A copy has downloaded. Sending your details to The Vault \u2014 please also email the downloaded PDF to nicole@thevaultnewcanaan.com.');
      setTimeout(function () { post.submit(); }, attached ? 600 : 2500);
    } catch (err) {
      setStatus('Something went wrong creating the PDF. Please download the fillable PDF above instead.', true);
    }
  });
})();
