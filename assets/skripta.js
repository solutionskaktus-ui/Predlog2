/* najamkorpe.rs: navigacija, kalkulator cene, otkrivanje pri skrolu */
(function () {
  'use strict';

  var mirno = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- mobilna navigacija ---------- */
  var prekidac = document.querySelector('.nav-prekidac');
  var nav = document.getElementById('glavna-nav');
  if (prekidac && nav) {
    prekidac.addEventListener('click', function () {
      var otvorena = nav.classList.toggle('otvorena');
      prekidac.setAttribute('aria-expanded', otvorena ? 'true' : 'false');
      prekidac.setAttribute('aria-label', otvorena ? 'Zatvori meni' : 'Otvori meni');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        nav.classList.remove('otvorena');
        prekidac.setAttribute('aria-expanded', 'false');
        prekidac.setAttribute('aria-label', 'Otvori meni');
      }
    });
  }

  /* ---------- kalkulator ---------- */
  var CENA_SAT = 40;      // evra po zapocetom satu, do petog sata
  var CEO_DAN = 240;      // fiksno, od sestog do desetog sata
  var PREKO_DESET = 20;   // dodatak po satu preko desetog

  var poljeSati = document.getElementById('sati');
  var prikazSati = document.getElementById('sati-prikaz');
  var dugmeManje = document.getElementById('manje');
  var dugmeVise = document.getElementById('vise');
  var izlazRad = document.getElementById('cena-rada');
  var izlazOpisRada = document.getElementById('opis-rada');
  var izlazDolazak = document.getElementById('cena-dolaska');
  var izlazOpisDolaska = document.getElementById('opis-dolaska');
  var izlazUkupno = document.getElementById('ukupno');
  var izlazObjasnjenje = document.getElementById('objasnjenje');
  var izlazNapomenaSati = document.getElementById('napomena-sati');

  function postaviIznos(el, tekst) {
    if (!el || el.textContent === tekst) { return; }
    if (mirno || !el.parentNode || !el.parentNode.classList.contains('kz-iznos')) {
      el.textContent = tekst;
      return;
    }
    var omot = el.parentNode;
    var stari = omot.querySelector('.kz-cifre.izlazi');
    if (stari) { stari.remove(); }
    var kopija = el.cloneNode(true);
    kopija.removeAttribute('id');
    kopija.setAttribute('aria-hidden', 'true');
    kopija.classList.add('izlazi');
    omot.appendChild(kopija);
    kopija.addEventListener('animationend', function () { kopija.remove(); });
    el.textContent = tekst;
    el.classList.remove('ulazi');
    void el.offsetWidth;
    el.classList.add('ulazi');
  }

  function evra(iznos) {
    return iznos.toLocaleString('sr-RS') + ' €';
  }

  /* Od sestog sata dolazak je uracunat u cenu, pa se ne dodaje posebno.
     Do petog sata se dolazak i dalje naplacuje po zoni. */
  function dolazakSeNaplacuje(sati) {
    return sati <= 5;
  }

  function cenaRada(sati) {
    if (sati <= 5) { return sati * CENA_SAT; }
    if (sati <= 10) { return CEO_DAN; }
    return CEO_DAN + (sati - 10) * PREKO_DESET;
  }

  function objasnjenje(sati) {
    if (sati <= 5) {
      return 'Do pet sati obračun ide po ' + CENA_SAT +
             ' evra za svaki započeti sat, a na to se dodaje dolazak po zoni.';
    }
    if (sati <= 10) {
      return 'Od šestog do desetog sata ukupna cena je ' + CEO_DAN +
             ' evra i dolazak je uračunat, bez obzira na to da li rad traje šest ili deset sati.';
    }
    var preko = sati - 10;
    return 'Prvih deset sati je ' + CEO_DAN + ' evra sa uračunatim dolaskom, pa još ' + preko +
           (preko === 1 ? ' sat' : (preko < 5 ? ' sata' : ' sati')) +
           ' po ' + PREKO_DESET + ' evra.';
  }

  function izabranaZona() {
    return document.querySelector('input[name="zona"]:checked');
  }

  function osvezi() {
    if (!poljeSati) { return; }
    var sati = parseInt(poljeSati.value, 10);
    if (isNaN(sati) || sati < 1) { sati = 1; }
    if (sati > 24) { sati = 24; }
    if (String(sati) !== poljeSati.value) { poljeSati.value = sati; }
    if (prikazSati) { prikazSati.textContent = sati; }
    poljeSati.style.setProperty('--p', ((sati - 1) / 23 * 100).toFixed(1) + '%');

    var zona = izabranaZona();
    var zonaCena = zona ? parseInt(zona.value, 10) : 0;
    var nazivZone = zona ? zona.getAttribute('data-naziv') : '';
    var naplata = dolazakSeNaplacuje(sati);
    var dolazak = naplata ? zonaCena : 0;
    var rad = cenaRada(sati);

    izlazOpisRada.textContent = 'Rad, ' + sati +
      (sati === 1 ? ' sat' : (sati % 10 >= 2 && sati % 10 <= 4 && (sati < 12 || sati > 14) ? ' sata' : ' sati'));
    izlazRad.textContent = evra(rad);
    izlazOpisDolaska.textContent = 'Dolazak, ' + nazivZone;
    if (!naplata && zonaCena > 0) {
      izlazDolazak.textContent = 'uračunat u cenu';
    } else if (dolazak === 0) {
      izlazDolazak.textContent = 'ne naplaćuje se';
    } else {
      izlazDolazak.textContent = evra(dolazak);
    }
    postaviIznos(izlazUkupno, evra(rad + dolazak));
    poslednjiIznos = evra(rad + dolazak);
    osveziTraku();
    izlazObjasnjenje.textContent = objasnjenje(sati);
    if (izlazNapomenaSati) {
      if (sati <= 5) {
        izlazNapomenaSati.textContent =
          'Obračun ide po započetom satu, a na to se dodaje dolazak po zoni.';
      } else if (sati <= 10) {
        izlazNapomenaSati.textContent =
          'Angažovanje od 6 do 10 sati je ' + CEO_DAN + ' evra, dolazak je uračunat.';
      } else {
        izlazNapomenaSati.textContent =
          'Do desetog sata je ' + CEO_DAN + ' evra sa uračunatim dolaskom, pa ' +
          PREKO_DESET + ' evra za svaki naredni sat.';
      }
    }
    osveziPoruke(sati, nazivZone, rad + dolazak);
  }

  /* iznos se preseli u lepljivu traku kada kalkulator prodje kroz ekran */
  var trakaTekst = document.getElementById('tp-tekst');
  var poslednjiIznos = '';
  var kalkProsao = false;
  function osveziTraku() {
    if (!trakaTekst) { return; }
    if (kalkProsao && poslednjiIznos) {
      trakaTekst.innerHTML = 'Vaša cena <span class="tp-cena">' + poslednjiIznos + '</span>';
    } else {
      trakaTekst.textContent = 'Izračunajte cenu';
    }
  }
  var kalkSekcija = document.getElementById('kalkulator');
  if (kalkSekcija && trakaTekst) {
    /* Polozaj kalkulatora se meri jednom i pamti, pa se pri skrolu samo poredi
       broj, umesto da se svaki kadar trazi getBoundingClientRect. */
    var dnoKalkulatora = 0;
    var izmeriKalkulator = function () {
      dnoKalkulatora = kalkSekcija.getBoundingClientRect().bottom + window.scrollY;
    };
    var proveriProlaz = function () {
      var prosao = window.scrollY > dnoKalkulatora;
      if (prosao !== kalkProsao) { kalkProsao = prosao; osveziTraku(); }
    };
    izmeriKalkulator();
    window.addEventListener('resize', izmeriKalkulator, { passive: true });
    proveriProlaz();
  }

  var TELEFON = '381648054523';
  function osveziPoruke(sati, zona, ukupno) {
    var tekst = 'Poštovani, sa sajta najamkorpe.rs: ' +
      'lokacija ' + zona + ', ' + sati + ' h rada, izračunata cena ' + ukupno + ' evra. ' +
      'Molim vas za slobodan termin.';
    var kodiran = encodeURIComponent(tekst);
    var viber = document.getElementById('veza-viber');
    var wa = document.getElementById('veza-whatsapp');
    var mejl = document.getElementById('veza-mejl');
    if (viber) { viber.href = 'viber://forward?text=' + kodiran; }
    if (wa) { wa.href = 'https://wa.me/' + TELEFON + '?text=' + kodiran; }
    if (mejl) {
      mejl.href = 'mailto:info@najamkorpe.rs?subject=' +
        encodeURIComponent('Upit za najam korpe') + '&body=' + kodiran;
    }
  }

  if (poljeSati) {
    poljeSati.addEventListener('input', osvezi);
    poljeSati.addEventListener('change', osvezi);
    if (dugmeManje) {
      dugmeManje.addEventListener('click', function () {
        poljeSati.value = Math.max(1, (parseInt(poljeSati.value, 10) || 1) - 1);
        osvezi();
      });
    }
    if (dugmeVise) {
      dugmeVise.addEventListener('click', function () {
        poljeSati.value = Math.min(24, (parseInt(poljeSati.value, 10) || 1) + 1);
        osvezi();
      });
    }
    document.querySelectorAll('input[name="zona"]').forEach(function (el) {
      el.addEventListener('change', osvezi);
    });
    osvezi();
  }

  /* ---------- otkrivanje pri skrolu, sa kaskadom ---------- */
  var zaOtkrivanje = document.querySelectorAll('.otkrij');
  if ('IntersectionObserver' in window && !mirno) {
    var posmatrac = new IntersectionObserver(function (unosi) {
      unosi.forEach(function (u) {
        if (u.isIntersecting) {
          u.target.classList.add('vidljiv');
          posmatrac.unobserve(u.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    zaOtkrivanje.forEach(function (el) {
      var roditelj = el.parentNode;
      if (!roditelj.__redosled) { roditelj.__redosled = 0; }
      el.style.setProperty('--i', Math.min(roditelj.__redosled++, 6));
      posmatrac.observe(el);
    });
  } else {
    zaOtkrivanje.forEach(function (el) { el.classList.add('vidljiv'); });
  }


  /* ---------- brojke u plavoj traci odbrojavaju ---------- */
  var brojke = document.querySelectorAll('.brojka b');
  if (brojke.length && !mirno && 'IntersectionObserver' in window) {
    var cuvarBrojki = new IntersectionObserver(function (unosi) {
      unosi.forEach(function (u) {
        if (!u.isIntersecting) { return; }
        cuvarBrojki.unobserve(u.target);
        var el = u.target;
        var pun = el.textContent.trim();
        var slog = pun.match(/^([0-9]+(?:[.,][0-9]+)?)(.*)$/);
        if (!slog) { return; }
        var sirovo = slog[1];
        var rep = slog[2];
        var decimale = sirovo.indexOf(',') > -1 ? sirovo.split(',')[1].length : 0;
        var cilj = parseFloat(sirovo.replace(',', '.'));
        var trajanje = 900;
        var start = null;
        function ispis(v) {
          var s = v.toFixed(decimale);
          return (decimale ? s.replace('.', ',') : s) + rep;
        }
        function korak(vreme) {
          if (start === null) { start = vreme; }
          var p = Math.min((vreme - start) / trajanje, 1);
          var lako = 1 - Math.pow(1 - p, 3);
          el.textContent = ispis(cilj * lako);
          if (p < 1) { requestAnimationFrame(korak); }
          else { el.textContent = pun; }
        }
        requestAnimationFrame(korak);
      });
    }, { threshold: 0.6 });
    brojke.forEach(function (el) { cuvarBrojki.observe(el); });
  }

  /* ---------- skala visine se puni kad udje u ekran ---------- */
  var mera = document.querySelector('.visina');
  if (mera && 'IntersectionObserver' in window) {
    if (mirno) { mera.classList.add('vidljiv'); }
    else {
      var cuvarVisine = new IntersectionObserver(function (unosi) {
        unosi.forEach(function (u) {
          if (u.isIntersecting) { u.target.classList.add('vidljiv'); cuvarVisine.unobserve(u.target); }
        });
      }, { threshold: 0.35 });
      cuvarVisine.observe(mera);
    }
  }


  /* ---------- korpa se dize dok skrolujes ---------- */
  var kadar = document.getElementById('dizanje-kadar');
  if (kadar && !mirno) {
    var naTelefonu = window.matchMedia('(max-width: 700px)').matches;
    /* Telefon je ranije dobijao 13 kadrova pa se strela pomerala u skokovima.
       Sada ide istih 25 kao na racunaru, samo u manjoj rezoluciji: kutija je na
       telefonu 331 CSS px, dakle 700 px pokriva i ekrane sa dvostrukom gustinom. */
    var UKUPNO = 25;
    /* Verzija u putanji je obavezna: mobilni kadrovi su prebrojani sa 13 na 25, pa
       ista imena m-01 do m-13 sada nose druge polozaje strele. Bez ovoga bi posetilac
       sa starim kesom dobio pomesanu animaciju. */
    var VERZIJA = 'v=51';
    var putanja = function (i) {
      var b = i < 10 ? '0' + i : String(i);
      return (naTelefonu ? 'assets/img/dizanje-m/m-' + b + '.webp'
                         : 'assets/img/dizanje/k-' + b + '.webp') + '?' + VERZIJA;
    };
    /* Prvi kadar vec stoji u HTML-u, kroz <picture>, pa telefon skida mobilni a
       racunar desktopski. Ovde se src ne dira, samo se ukljucuje u slojeve. */
    kadar.classList.add('sloj', 'tekuci');

    /* Svaki kadar dobija svoj sloj, pa se pri skrolu samo pali i gasi prozirnost.
       Ranije se menjala putanja iste slike, sto je teralo dekodiranje u toku skrola
       i pravilo trzanje na telefonu. */
    var okvir = kadar.closest('.masina-foto') || kadar.parentNode;
    var slojevi = [kadar];
    var spremno = false;
    var napraviSlojeve = function () {
      var cekanja = [];
      for (var i = 2; i <= UKUPNO; i++) {
        var s = document.createElement('img');
        s.className = 'sloj';
        s.alt = '';
        s.setAttribute('aria-hidden', 'true');
        s.decoding = 'async';
        s.src = putanja(i);
        okvir.appendChild(s);
        slojevi.push(s);
        if (s.decode) { cekanja.push(s.decode().catch(function () {})); }
      }
      if (kadar.decode) { cekanja.push(kadar.decode().catch(function () {})); }
      /* Slojevi rade cim postoje. Dekodiranje je samo zagrevanje, ne uslov,
         jer obecanje iz decode() ume da nikad ne stigne ako je strana sakrivena. */
      spremno = true;
      osveziKadar();
    };
    var pokrenuto = false;
    var pokreni = function () {
      if (pokrenuto) { return; }
      pokrenuto = true;
      napraviSlojeve();
    };
    if (window.requestIdleCallback) { requestIdleCallback(pokreni, { timeout: 1200 }); }
    setTimeout(pokreni, 1200);

    var hero = document.querySelector('.hero');
    var raspon = 1;
    var izmeri = function () {
      var vh = window.innerHeight || 800;
      var visina = hero ? hero.offsetHeight : vh;
      // veci raspon znaci da strela treba vise skrola da se ispravi, dakle sporije
      raspon = Math.max((visina - vh * 0.3) * 1.3, 380);
    };
    var trenutni = 1;
    var osveziKadar = function () {
      if (!spremno) { return; }
      var p = Math.min(Math.max(window.scrollY / raspon, 0), 1);
      var idx = Math.min(UKUPNO, Math.max(1, Math.round(p * (UKUPNO - 1)) + 1));
      if (idx !== trenutni && slojevi[idx - 1]) {
        slojevi[trenutni - 1].classList.remove('tekuci');
        slojevi[idx - 1].classList.add('tekuci');
        trenutni = idx;
      }
    };
    izmeri();
    window.addEventListener('resize', function () { izmeri(); osveziKadar(); }, { passive: true });
  }

  /* ---------- zaglavlje se stanjuje pri skrolu ---------- */
  var zaglavlje = document.querySelector('.zaglavlje');
  if (zaglavlje) {
    var zbijenoSad = false;
    var proveriZaglavlje = function () {
      var treba = window.scrollY > 40;
      if (treba !== zbijenoSad) { zbijenoSad = treba; zaglavlje.classList.toggle('zbijeno', treba); }
    };
    proveriZaglavlje();
  }

  /* ---------- naslovi se sklapaju iz reda ---------- */
  function razlozi(naslov) {
    var delovi = [];
    var r = 0;
    Array.prototype.slice.call(naslov.childNodes).forEach(function (cvor) {
      if (cvor.nodeType === 3) {
        cvor.textContent.split(/(\s+)/).forEach(function (deo) {
          if (!deo) { return; }
          if (/^\s+$/.test(deo)) { delovi.push(document.createTextNode(' ')); return; }
          delovi.push(napraviRec(deo, null, r++));
        });
      } else if (cvor.nodeType === 1) {
        var klasa = cvor.getAttribute('class');
        cvor.textContent.split(/(\s+)/).forEach(function (deo) {
          if (!deo) { return; }
          if (/^\s+$/.test(deo)) { delovi.push(document.createTextNode(' ')); return; }
          delovi.push(napraviRec(deo, klasa, r++));
        });
      }
    });
    if (!delovi.length) { return false; }
    naslov.textContent = '';
    delovi.forEach(function (d) { naslov.appendChild(d); });
    return true;
  }
  function napraviRec(tekst, klasa, redni) {
    var omot = document.createElement('span');
    omot.className = 'rec-omot';
    var rec = document.createElement('span');
    rec.className = 'rec' + (klasa ? ' ' + klasa : '');
    rec.style.setProperty('--r', redni);
    rec.textContent = tekst;
    omot.appendChild(rec);
    return omot;
  }
  if (!mirno) {
    var naslovi = document.querySelectorAll('.hero h1, .sekcija h2');
    if (naslovi.length && 'IntersectionObserver' in window) {
      var cuvarNaslova = new IntersectionObserver(function (unosi) {
        unosi.forEach(function (u) {
          if (!u.isIntersecting) { return; }
          u.target.classList.add('vidljiv');
          cuvarNaslova.unobserve(u.target);
        });
      }, { rootMargin: '0px 0px -6% 0px' });
      naslovi.forEach(function (n) {
        if (!razlozi(n)) { return; }
        n.classList.remove('otkrij');
        n.classList.add('naslov-anim');
        cuvarNaslova.observe(n);
      });
    }
  }

  /* ---------- prolazi li vozilo kroz kapiju ---------- */
  var kapija = document.getElementById('kapija');
  if (kapija) {
    var SIRINA_VOZILA = 220;   // cm
    var UDOBNO = 260;          // cm, sa retrovizorima i rezervom
    var crtez = document.querySelector('.prolaz-crtez');
    var stubL = document.getElementById('stub-levi');
    var stubD = document.getElementById('stub-desni');
    var meraLinija = document.getElementById('mera-levo');
    var meraTekst = document.getElementById('mera-tekst');
    var prikazKapije = document.getElementById('kapija-prikaz');
    var stanje = document.getElementById('prolaz-stanje');
    var PX_PO_CM = 154 / SIRINA_VOZILA;   // karoserija je 154 px siroka na crtezu

    function osveziProlaz() {
      var cm = parseInt(kapija.value, 10);
      if (isNaN(cm)) { cm = 300; }
      var sirina = cm * PX_PO_CM;
      var levo = 220 - sirina / 2;
      var desno = 220 + sirina / 2;
      stubL.setAttribute('x', (levo - 118).toFixed(1));
      stubD.setAttribute('x', desno.toFixed(1));
      meraLinija.setAttribute('x1', levo.toFixed(1));
      meraLinija.setAttribute('x2', desno.toFixed(1));

      var tekst = (cm / 100).toFixed(2).replace('.', ',') + ' m';
      meraTekst.textContent = tekst;
      prikazKapije.textContent = tekst;
      kapija.style.setProperty('--p', ((cm - 180) / 320 * 100).toFixed(1) + '%');

      crtez.classList.remove('tesno', 'ne-staje');
      stanje.classList.remove('tesno', 'ne-staje');
      if (cm < SIRINA_VOZILA + 10) {
        crtez.classList.add('ne-staje');
        stanje.classList.add('ne-staje');
        stanje.textContent = 'Ne prolazi. Vozilo je široko 2,20 m.';
      } else if (cm < UDOBNO) {
        crtez.classList.add('tesno');
        stanje.classList.add('tesno');
        stanje.textContent = 'Tesno je. Retrovizori se sklapaju, prolazi uz vođenje. Javite se pre izlaska.';
      } else {
        stanje.textContent = 'Prolazi bez problema.';
      }
    }
    kapija.addEventListener('input', osveziProlaz);
    kapija.addEventListener('change', osveziProlaz);
    osveziProlaz();
  }

  /* ---------- carobnjak: jedno pitanje na ekranu ---------- */
  var carobnjak = document.getElementById('carobnjak');
  var naKorak = function () {};
  if (carobnjak) {
    var paneli = carobnjak.querySelectorAll('.korak-panel');
    var tacke = carobnjak.querySelectorAll('.tacke li');
    naKorak = function (broj, skroluj) {
      paneli.forEach(function (p) {
        p.hidden = p.getAttribute('data-korak') !== String(broj);
      });
      tacke.forEach(function (t, i) { t.classList.toggle('on', i < broj); });
      if (skroluj) {
        var gore = carobnjak.getBoundingClientRect().top + window.scrollY - 90;
        window.scrollTo({ top: gore, behavior: mirno ? 'auto' : 'smooth' });
      }
      var vidljiv = carobnjak.querySelector('.korak-panel:not([hidden])');
      var prvo = vidljiv && vidljiv.querySelector('input, button, a');
      if (prvo && skroluj) { prvo.focus({ preventScroll: true }); }
    };
    carobnjak.querySelectorAll('.napred, .nazad').forEach(function (d) {
      d.addEventListener('click', function () {
        naKorak(parseInt(d.getAttribute('data-na'), 10), true);
      });
    });
  }

  /* ---------- iz cenovnika pravo na rezultat ---------- */
  document.querySelectorAll('.cena-veza[data-sati]').forEach(function (veza) {
    veza.addEventListener('click', function () {
      var sati = parseInt(veza.getAttribute('data-sati'), 10);
      if (poljeSati && !isNaN(sati)) {
        poljeSati.value = sati;
        osvezi();
      }
      naKorak(3, false);
    });
  });

  /* ---------- uvecavanje fotografija sa terena ---------- */
  var lupa = document.querySelector('.lupa');
  if (lupa && typeof lupa.showModal === 'function') {
    var lupaSlika = document.getElementById('lupa-slika');
    var lupaOpis = document.getElementById('lupa-opis');
    document.querySelectorAll('.lupa-otvori').forEach(function (dugme) {
      dugme.addEventListener('click', function () {
        lupaSlika.src = dugme.getAttribute('data-slika');
        lupaSlika.alt = dugme.getAttribute('data-opis') || '';
        lupaOpis.textContent = dugme.getAttribute('data-opis') || '';
        lupa.showModal();
      });
    });
    lupa.querySelector('.lupa-zatvori').addEventListener('click', function () { lupa.close(); });
    lupa.addEventListener('click', function (e) {
      if (e.target === lupa) { lupa.close(); }
    });
    /* prazan src je zahtev ka adresi same strane, pa se atribut sklanja */
    lupa.addEventListener('close', function () { lupaSlika.removeAttribute('src'); });
  }

  /* ---------- galerija koja se prevlaci na telefonu ---------- */
  var galerija = document.querySelector('.galerija');
  var gvTacke = document.getElementById('gv-tacke');
  var gvTekuca = document.getElementById('gv-tekuca');
  if (galerija && gvTacke && gvTekuca) {
    var snimci = galerija.querySelectorAll('.snimak-teren');
    for (var i = 0; i < snimci.length; i++) {
      var t = document.createElement('i');
      if (i === 0) { t.className = 'on'; }
      gvTacke.appendChild(t);
    }
    var tackice = gvTacke.querySelectorAll('i');
    var poslednja = 0;
    var sirinaSnimka = 0;
    var izmeriSnimak = function () {
      sirinaSnimka = snimci.length ? snimci[0].offsetWidth + 12 : 0;
    };
    izmeriSnimak();
    window.addEventListener('resize', izmeriSnimak, { passive: true });
    var osveziVodic = function () {
      if (!snimci.length || !sirinaSnimka) { return; }
      var sirina = sirinaSnimka;
      var idx = Math.round(galerija.scrollLeft / sirina);
      idx = Math.min(snimci.length - 1, Math.max(0, idx));
      if (idx === poslednja) { return; }
      poslednja = idx;
      gvTekuca.textContent = idx + 1;
      tackice.forEach(function (t, n) { t.classList.toggle('on', n === idx); });
    };
    galerija.addEventListener('scroll', osveziVodic, { passive: true });
  }

  /* ---------- lepljiva traka uleti tek posle naslovne ---------- */
  var traka = document.querySelector('.traka-poziv');
  var heroDno = 0;
  var trakaGore = false;
  var izmeriHero = function () {
    var hero = document.querySelector('.hero');
    heroDno = hero ? hero.offsetHeight * 0.6 : 300;
  };
  var proveriTraku = function () {
    if (!traka) { return; }
    var treba = window.scrollY > heroDno;
    if (treba !== trakaGore) { trakaGore = treba; traka.classList.toggle('vidljiva', treba); }
  };
  if (traka) {
    izmeriHero();
    window.addEventListener('resize', izmeriHero, { passive: true });
  }

  /* ---------- plava traka se popunjava dok brojke odbrojavaju ---------- */
  var trakaBrojki = document.querySelector('.brojke');
  if (trakaBrojki && 'IntersectionObserver' in window) {
    if (mirno) { trakaBrojki.classList.add('puna'); }
    else {
      new IntersectionObserver(function (unosi, sam) {
        unosi.forEach(function (u) {
          if (!u.isIntersecting) { return; }
          u.target.classList.add('puna');
          sam.unobserve(u.target);
        });
      }, { threshold: 0.4 }).observe(trakaBrojki);
    }
  }

  /* ---------- pitanja se otvaraju i zatvaraju glatko ---------- */
  if (!mirno) {
    document.querySelectorAll('.pitanje').forEach(function (p) {
      var omot = p.querySelector('.omot-odgovora');
      var glava = p.querySelector('summary');
      if (!omot || !glava) { return; }
      glava.addEventListener('click', function (e) {
        if (!p.open) { return; }          /* otvaranje ide samo od sebe */
        e.preventDefault();               /* zatvaranje cekamo da se animira */
        omot.addEventListener('transitionend', function zatvori(ev) {
          if (ev.propertyName !== 'grid-template-rows') { return; }
          omot.removeEventListener('transitionend', zatvori);
          p.open = false;
          p.classList.remove('zatvara');
        });
        p.classList.add('zatvara');
      });
    });
  }

  /* ---------- petlja se vrti samo dok je na ekranu ---------- */
  var snimakPetlje = document.querySelector('.petlja-snimak');
  var petljaIde = false;
  var proveriPetlju = function () {
    if (!snimakPetlje) { return; }
    var o = snimakPetlje.getBoundingClientRect();
    var vh = window.innerHeight || 800;
    var uKadru = o.bottom > -80 && o.top < vh + 80;
    if (uKadru === petljaIde) { return; }
    petljaIde = uKadru;
    if (uKadru) {
      var obecanje = snimakPetlje.play();
      if (obecanje && obecanje.catch) { obecanje.catch(function () {}); }
    } else {
      snimakPetlje.pause();
    }
  };

  /* ---------- jedan osluskivac skrola za sve, jednom po kadru ekrana ---------- */
  var poslovi = [];
  if (typeof osveziKadar === 'function') { poslovi.push(osveziKadar); }
  if (typeof proveriProlaz === 'function') { poslovi.push(proveriProlaz); }
  if (typeof proveriZaglavlje === 'function') { poslovi.push(proveriZaglavlje); }
  poslovi.push(proveriTraku);
  if (snimakPetlje && !mirno) { poslovi.push(proveriPetlju); }
  if (poslovi.length) {
    var zakazano = false;
    var tik = function () {
      zakazano = false;
      for (var i = 0; i < poslovi.length; i++) { poslovi[i](); }
    };
    window.addEventListener('scroll', function () {
      if (!zakazano) { zakazano = true; requestAnimationFrame(tik); }
    }, { passive: true });
    tik();
  }

  /* ---------- godina u podnozju ---------- */
  var godina = document.getElementById('godina');
  if (godina) { godina.textContent = new Date().getFullYear(); }
})();
