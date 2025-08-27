// ---------- Genel helperlar ----------
function $(id){return document.getElementById(id)}
function show(el){el.classList.remove('hidden')}
function hide(el){el.classList.add('hidden')}

// ---------- Kullanıcı sistemi (LocalStorage) ----------
function userKey(u){return "ao_user_" + u}
function libKey(u){return "ao_lib_" + u}
function notifKey(u){return "ao_notif_" + u}

// password policy
function validatePassword(p){
  if(typeof p!=="string") return "Şifre geçersiz";
  if(p.length < 8) return "Şifre en az 8 karakter olmalı";
  if(!/[A-Z]/.test(p)) return "En az bir büyük harf içermeli";
  if(!/[a-z]/.test(p)) return "En az bir küçük harf içermeli";
  if(!/[0-9]/.test(p)) return "En az bir rakam içermeli";
  if(!/[^A-Za-z0-9]/.test(p)) return "En az bir özel karakter (örn: !@#) içermeli";
  return null;
}

// register & login page logic
if(location.pathname.endsWith("index.html") || location.pathname === "/" ){
  // elements
  const btnRegister = $("btnRegister");
  const btnLogin = $("btnLogin");
  const btnToRegister = $("btnToRegister");

  if(btnRegister){
    btnRegister.addEventListener("click", ()=>{
      const user = $("regUser").value.trim();
      const pass = $("regPass").value;
      const msg = $("regMsg");
      msg.innerText = "";
      if(!user || !pass){ msg.innerText = "Lütfen kullanıcı adı ve şifre girin"; return; }
      if(localStorage.getItem(userKey(user))){ msg.innerText = "Bu kullanıcı adı zaten alınmış"; return; }
      const v = validatePassword(pass);
      if(v){ msg.innerText = v; return; }
      // store password in plain text (only offline demo). In real app, hash on server.
      localStorage.setItem(userKey(user), pass);
      localStorage.setItem(libKey(user), JSON.stringify([]));
      localStorage.setItem(notifKey(user), JSON.stringify([
        {t: new Date().toISOString(), m: "Hoş geldin! Area Official'e kayıt oldun."},
        {t: new Date().toISOString(), m: "siteDEEP v1.0 yayınlandı."}
      ]));
      $("regMsg").innerText = "Kayıt başarılı! Giriş yapabilirsiniz.";
    });
  }

  if(btnLogin){
    btnLogin.addEventListener("click", ()=>{
      const user = $("loginUser").value.trim();
      const pass = $("loginPass").value;
      const msg = $("loginMsg");
      msg.innerText = "";
      const stored = localStorage.getItem(userKey(user));
      if(stored && stored === pass){
        localStorage.setItem("ao_logged", user);
        location.href = "dashboard.html";
      } else {
        msg.innerText = "Hatalı kullanıcı adı veya şifre";
      }
    });
  }

  if(btnToRegister){
    btnToRegister.addEventListener("click", ()=>{ $("regUser").focus() })
  }
}

// ---------- Dashboard logic ----------
if(location.pathname.endsWith("dashboard.html")){
  const user = localStorage.getItem("ao_logged");
  if(!user){ location.href = "index.html"; }
  $("currentUser").innerText = user;
  renderLib();
  renderNotifs();

  $("logoutBtn").addEventListener("click", ()=>{ localStorage.removeItem("ao_logged"); location.href = "index.html"; });

  // account modal
  const accountBtn = $("accountBtn");
  const accountModal = $("accountModal");
  const closeAcc = $("closeAcc");
  const changePassBtn = $("changePassBtn");
  $("accUser").innerText = user;
  accountBtn.addEventListener("click", ()=> accountModal.classList.toggle("hidden"));
  closeAcc.addEventListener("click", ()=> accountModal.classList.add("hidden"));

  changePassBtn.addEventListener("click", ()=>{
    const oldP = $("oldPass").value;
    const newP = $("newPass").value;
    const msg = $("accMsg");
    msg.innerText = "";
    const stored = localStorage.getItem(userKey(user));
    if(stored !== oldP){ msg.innerText = "Eski şifre hatalı"; return; }
    const v = validatePassword(newP);
    if(v){ msg.innerText = v; return; }
    localStorage.setItem(userKey(user), newP);
    msg.innerText = "Şifre başarıyla değiştirildi.";
    $("oldPass").value = ""; $("newPass").value = "";
  });
}

// ---------- Library & Notifications (shared functions) ----------
function getLibFor(user){
  return JSON.parse(localStorage.getItem(libKey(user)) || "[]");
}
function setLibFor(user, arr){ localStorage.setItem(libKey(user), JSON.stringify(arr)); }
function getNotifs(user){ return JSON.parse(localStorage.getItem(notifKey(user)) || "[]"); }
function setNotifs(user, arr){ localStorage.setItem(notifKey(user), JSON.stringify(arr)); }

function renderLib(){
  const user = localStorage.getItem("ao_logged");
  if(!user) return;
  const lib = getLibFor(user);
  const ul = $("libList");
  if(!ul) return;
  ul.innerHTML = "";
  if(lib.length===0){ ul.innerHTML = "<li class='muted small'>Kütüphaneniz boş</li>"; return; }
  lib.forEach(app=>{
    const li = document.createElement("li");
    li.textContent = app;
    const btns = document.createElement("div");
    const open = document.createElement("button");
    open.className="btn ghost";
    open.innerText="Aç";
    open.onclick = ()=> window.open("files/"+app,"_blank");
    const rem = document.createElement("button");
    rem.className="btn";
    rem.innerText="Kaldır";
    rem.onclick = ()=> {
      let arr = getLibFor(user).filter(x=>x!==app);
      setLibFor(user, arr);
      renderLib();
    };
    btns.appendChild(open); btns.appendChild(rem);
    li.appendChild(btns);
    ul.appendChild(li);
  });

  // total downloads
  $("totalDownloads").innerText = lib.length;
}

function renderNotifs(){
  const user = localStorage.getItem("ao_logged");
  if(!user) return;
  const arr = getNotifs(user);
  const ul = $("notifList");
  if(!ul) return;
  ul.innerHTML = "";
  arr.forEach(n=>{
    const li = document.createElement("li");
    li.innerHTML = `<div class="muted small">${new Date(n.t).toLocaleString()}</div><div>${n.m}</div>`;
    ul.appendChild(li);
  });
}

// ---------- Download from OS pages ----------
function downloadFromOS(filename){
  const user = localStorage.getItem("ao_logged");
  if(!user){ alert("Lütfen giriş yapın"); location.href="index.html"; return; }
  // add to lib
  let lib = getLibFor(user);
  if(!lib.includes(filename)) lib.push(filename);
  setLibFor(user, lib);
  renderLib();

  // trigger download (from files/)
  const link = document.createElement("a");
  link.href = "files/" + filename;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();

  // push notification
  let nots = getNotifs(user);
  nots.unshift({t:new Date().toISOString(), m: filename + " indirildi."});
  setNotifs(user, nots);
  renderNotifs();
}

// ---------- OS pages logic (clock, stopwatch, calendar) ----------
function initOSPage(prefix){
  // prefix example: "Win" -> element ids: clockWin, swStartWin...
  const clock = $("clock"+prefix);
  if(clock) startClock(clock);

  // stopwatch
  const swTime = $("swTime"+prefix);
  const startBtn = $("swStart"+prefix);
  const stopBtn = $("swStop"+prefix);
  const resetBtn = $("swReset"+prefix);
  if(swTime && startBtn){
    let sw = {running:false, start:0, offset:0, timer:null};
    startBtn.addEventListener("click", ()=>{
      if(sw.running) return;
      sw.running = true; sw.start = Date.now(); sw.timer = setInterval(()=>{
        const t = sw.offset + (Date.now() - sw.start);
        swTime.innerText = formatTime(t);
      },100);
    });
    stopBtn.addEventListener("click", ()=>{
      if(!sw.running) return;
      sw.running=false; sw.offset += Date.now() - sw.start; clearInterval(sw.timer);
    });
    resetBtn.addEventListener("click", ()=>{
      sw.running=false; sw.start=0; sw.offset=0; clearInterval(sw.timer); swTime.innerText = "00:00:00.0";
    });
  }

  // calendar
  const cal = $("calendar"+prefix);
  if(cal) renderCalendar(cal, prefix.toLowerCase());
}

function startClock(el){
  function tick(){
    const d = new Date();
    el.innerText = d.toLocaleTimeString();
  }
  tick(); setInterval(tick,1000);
}
function formatTime(ms){
  const d = new Date(ms);
  const hh = String(Math.floor(ms/3600000)).padStart(2,"0");
  const mm = String(d.getUTCMinutes()).padStart(2,"0");
  const ss = String(d.getUTCSeconds()).padStart(2,"0");
  const tenths = String(Math.floor(d.getUTCMilliseconds()/100)).padStart(1,"0");
  return `${hh}:${mm}:${ss}.${tenths}`;
}

// simple calendar that stores notes per day in localStorage with key ao_cal_<user>_<prefix>
function renderCalendar(container, prefix){
  const user = localStorage.getItem("ao_logged"); if(!user) return;
  const key = `ao_cal_${user}_${prefix}`;
  const saved = JSON.parse(localStorage.getItem(key) || "{}");
  const now = new Date();
  const year = now.getFullYear(), month = now.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month+1, 0).getDate();

  const title = document.createElement("div");
  title.innerText = `${now.toLocaleString('tr-TR',{month:'long'})} ${year}`;
  title.style.fontWeight = "700";
  title.style.marginBottom = "8px";
  container.innerHTML = ""; container.appendChild(title);

  const grid = document.createElement("div");
  grid.style.display="grid"; grid.style.gridTemplateColumns="repeat(7,1fr)"; grid.style.gap="6px";
  // day names
  ["Paz","Pts","Sal","Çar","Per","Cum","Cts"].forEach(n=>{
    const el = document.createElement("div"); el.className="muted small"; el.style.textAlign="center"; el.innerText=n; grid.appendChild(el);
  });
  // blanks
  for(let i=0;i<firstDay;i++){ const b=document.createElement("div"); grid.appendChild(b); }
  // days
  for(let d=1; d<=daysInMonth; d++){
    const cell = document.createElement("div");
    cell.style.minHeight="48px"; cell.style.padding="6px"; cell.style.borderRadius="8px"; cell.style.background="rgba(255,255,255,0.02)";
    const hd = document.createElement("div"); hd.style.fontWeight="700"; hd.innerText=d; cell.appendChild(hd);
    const note = document.createElement("div"); note.className="muted small"; note.style.marginTop="6px";
    const keyDay = `${year}-${month+1}-${d}`;
    note.innerText = saved[keyDay] || "";
    cell.appendChild(note);
    cell.onclick = ()=>{
      const val = prompt("Gün notu (boş bırakıp Tamam tuşuna basarsanız silinir):", saved[keyDay] || "");
      if(val === null) return;
      if(val.trim()===""){ delete saved[keyDay]; } else { saved[keyDay]=val; }
      localStorage.setItem(key, JSON.stringify(saved));
      renderCalendar(container, prefix); // rerender
    };
    grid.appendChild(cell);
  }
  container.appendChild(grid);
}

// Initialize OS pages based on element IDs presence
document.addEventListener("DOMContentLoaded", ()=>{
  // if on an OS page
  if($("clockWin")) initOSPage("Win");
  if($("clockLin")) initOSPage("Lin");
  if($("clockMac")) initOSPage("Mac");

  // logout shortcuts on OS pages
  if($("logoutWin")) $("logoutWin").addEventListener("click", ()=>{ localStorage.removeItem("ao_logged"); location.href="index.html";});
  if($("logoutLin")) $("logoutLin").addEventListener("click", ()=>{ localStorage.removeItem("ao_logged"); location.href="index.html";});
  if($("logoutMac")) $("logoutMac").addEventListener("click", ()=>{ localStorage.removeItem("ao_logged"); location.href="index.html";});

  // render library & notifs when on dashboard or OS pages
  if(location.pathname.endsWith("dashboard.html") || location.pathname.endsWith("windows.html") || location.pathname.endsWith("linux.html") || location.pathname.endsWith("mac.html")){
    const user = localStorage.getItem("ao_logged");
    if(!user){ location.href="index.html"; return; }
    renderLib(); renderNotifs();
    $("currentUser") && ($("currentUser").innerText = user);
  }
});
