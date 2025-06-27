(async () => {
  // BLOQUEAR BOTÃO DIREITO
  document.addEventListener("contextmenu", e => e.preventDefault());

  // ======= OVERLAY =======
  const overlay = document.createElement("div");
  overlay.style.cssText = `
    position: fixed;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 480px;
    background: linear-gradient(135deg, #0f0f28, #1c1c3a);
    border: 1px solid rgba(255,255,255,0.1);
    backdrop-filter: blur(14px);
    color: white;
    z-index: 9999;
    font-family: 'Segoe UI', sans-serif;
    border-radius: 20px;
    padding: 22px;
    box-shadow: 0 0 25px rgba(0,0,0,0.7);
  `;

  const header = document.createElement("div");
  header.style.cssText = "text-align:center;width:100%;margin-top:-20px;margin-bottom:20px;";
  header.innerHTML = `
    <img src="https://i.imgur.com/5nmqcOu.jpeg" alt="Perfil" style="width:110px;height:110px;border-radius:20%;object-fit:cover;margin:0 auto 5px auto;display:block;">
    <h1 style="margin:4px 0 2px 0;font-size:22px;font-family:Arial,sans-serif;color:white;">𝙲𝚎𝚗𝚘𝚞𝚛𝚒𝚝𝚘𝚜 𝙴𝚡𝚙𝚊𝚗𝚜𝚊𝚘 𝙽𝚘𝚛𝚝𝚞𝚗𝚊</h1>
    <label style="font-size:15px;font-weight:bold;font-family:Arial,sans-serif;margin:0;color:#a1a1a1;">Sala do Futuro – CMSP Web</label>
  `;
  overlay.appendChild(header);

  const subtitle = document.createElement("p");
  subtitle.innerText = "Aguardando tarefas...";
  subtitle.style.cssText = "color: #ccc; text-align: center; margin-top: 5px;";

  const progressBarWrapper = document.createElement("div");
  progressBarWrapper.style.cssText = `
    width: 100%;
    height: 12px;
    background: rgba(255,255,255,0.08);
    border-radius: 6px;
    margin-top: 20px;
    overflow: hidden;
  `;

  const progressBar = document.createElement("div");
  progressBar.style.cssText = `
    height: 100%;
    width: 0%;
    background: linear-gradient(90deg, #00ffe1, #ff0099);
    transition: width 0.4s ease;
  `;
  progressBarWrapper.appendChild(progressBar);

  const logBox = document.createElement("div");
  logBox.style.cssText = `
    width: 100%;
    max-height: 160px;
    margin-top: 20px;
    padding: 12px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 10px;
    overflow-y: auto;
    font-size: 14px;
    line-height: 1.4em;
  `;

  const discordBtn = document.createElement("button");
  discordBtn.innerText = "💬 Entrar no Discord";
  discordBtn.style.cssText = `
    width: 100%;
    margin-top: 20px;
    padding: 10px;
    border: none;
    background: linear-gradient(90deg, #5865F2, #404eed);
    color: white;
    font-weight: bold;
    font-size: 14px;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.3s;
  `;
  discordBtn.onclick = () => window.open("https://discord.gg/332spXmetK", "_blank");

  overlay.appendChild(subtitle);
  overlay.appendChild(progressBarWrapper);
  overlay.appendChild(logBox);
  overlay.appendChild(discordBtn);
  document.body.appendChild(overlay);

  const toastContainer = document.createElement("div");
  toastContainer.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 20px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    z-index: 99999;
  `;
  document.body.appendChild(toastContainer);

  const style = document.createElement("style");
  style.innerHTML = `
    @keyframes toastProgress {
      0% { width: 100%; }
      100% { width: 0%; }
    }
  `;
  document.head.appendChild(style);

  function showToast(msg, success = true) {
    const toast = document.createElement("div");
    toast.style.cssText = `
      background: ${success ? '#2ecc71' : '#e74c3c'};
      color: white;
      padding: 10px 15px;
      border-radius: 8px;
      font-size: 14px;
      box-shadow: 0 0 8px rgba(0,0,0,0.3);
      position: relative;
      overflow: hidden;
    `;
    toast.innerText = msg;
    const progress = document.createElement("div");
    progress.style.cssText = `
      position: absolute;
      bottom: 0; left: 0;
      height: 3px;
      background: white;
      width: 100%;
      animation: toastProgress 4s linear forwards;
    `;
    toast.appendChild(progress);
    toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  }

  function logTask(msg, success = true) {
    const entry = document.createElement("div");
    entry.innerHTML = success
      ? `<span style='color:#a1ffa1'>✅ ${msg}</span>`
      : `<span style='color:#ffa1a1'>❌ ${msg}</span>`;
    logBox.appendChild(entry);
    logBox.scrollTop = logBox.scrollHeight;
    showToast(msg, success);
  }

  function updateProgress(pct, msg) {
    progressBar.style.width = pct + "%";
    subtitle.innerText = msg;
  }

  async function retry(fn, retries = 3, delay = 2000) {
    try {
      return await fn();
    } catch (e) {
      if (e.message.includes("429") && retries > 0) {
        await new Promise(r => setTimeout(r, delay));
        return retry(fn, retries - 1, delay * 2);
      }
      throw e;
    }
  }

  async function processResource(id, name) {
    try {
      logTask(`📄 Página: ${name}`);
      await retry(() => fetch(`https://expansao.educacao.sp.gov.br/mod/resource/view.php?id=${id}`, {
        method: "GET",
        credentials: "include"
      }));
      return true;
    } catch (e) {
      logTask(`Erro: ${name}`, false);
      return false;
    }
  }

  async function processQuiz(link, name) {
    try {
      logTask(`🎯 Avaliação: ${name}`);
      const url = new URL(link);
      const id = url.searchParams.get("id");

      const res1 = await fetch(link, { credentials: "include" });
      const html1 = await res1.text();
      const sesskey = html1.match(/sesskey=["']?([^"']+)/)?.[1];
      if (!sesskey) throw new Error("Sesskey não encontrada");

      const startData = new URLSearchParams();
      startData.append("cmid", id);
      startData.append("sesskey", sesskey);

      const startRes = await fetch("https://expansao.educacao.sp.gov.br/mod/quiz/startattempt.php", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: startData.toString(), redirect: "follow"
      });

      const redirectUrl = startRes.url;
      const attemptId = redirectUrl.match(/attempt=(\d+)/)?.[1];
      if (!attemptId) throw new Error("ID tentativa não encontrado");

      const res2 = await fetch(redirectUrl, { credentials: "include" });
      const html2 = await res2.text();
      const doc = new DOMParser().parseFromString(html2, "text/html");
      const options = [...doc.querySelectorAll("input[type='radio']")].filter(r => r.name.includes("_answer") && r.value !== "-1");
      if (!options.length) throw new Error("Nenhuma resposta encontrada");

      const selected = options[Math.floor(Math.random() * options.length)];
      const sequence = doc.querySelector(`input[name$=":sequencecheck"]`)?.value;
      const questionId = selected.name.split(":")[0];

      const formData = new FormData();
      formData.append(`${questionId}:1_:flagged`, "0");
      formData.append(`${questionId}:1_:sequencecheck`, sequence);
      formData.append(selected.name, selected.value);
      formData.append("next", "Finalizar tentativa ...");
      formData.append("attempt", attemptId);
      formData.append("sesskey", sesskey);
      formData.append("slots", "1");

      await fetch(`https://expansao.educacao.sp.gov.br/mod/quiz/processattempt.php?cmid=${id}`, {
        method: "POST", credentials: "include", body: formData, redirect: "follow"
      });

      const finish = new URLSearchParams();
      finish.append("attempt", attemptId);
      finish.append("finishattempt", "1");
      finish.append("timeup", "0");
      finish.append("slots", "");
      finish.append("cmid", id);
      finish.append("sesskey", sesskey);

      await fetch("https://expansao.educacao.sp.gov.br/mod/quiz/processattempt.php", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: finish.toString(), redirect: "follow"
      });

      return true;
    } catch (e) {
      logTask(`Erro avaliação: ${name}`, false);
      return false;
    }
  }

  async function processAll() {
    const activities = document.querySelectorAll("li.activity");
    const pages = [], quizzes = [];

    activities.forEach(activity => {
      const link = activity.querySelector("a.aalink");
      const complete = activity.querySelector(".completion-dropdown button");
      if (link && (!complete || !complete.classList.contains("btn-success"))) {
        const id = new URL(link.href).searchParams.get("id");
        const name = link.textContent.trim();
        if (/responda|pause/i.test(name)) quizzes.push({ link: link.href, name });
        else pages.push({ id, name });
      }
    });

    const total = pages.length + quizzes.length;
    let done = 0;

    logTask(`🔎 ${pages.length} páginas e ${quizzes.length} avaliações encontradas`);
    for (let p of pages) {
      updateProgress((done / total) * 100, `Página: ${p.name}`);
      await processResource(p.id, p.name);
      done++;
    }

    for (let q of quizzes) {
      updateProgress((done / total) * 100, `Avaliação: ${q.name}`);
      await processQuiz(q.link, q.name);
      done++;
    }

    updateProgress(100, "✅ Tudo finalizado!");
    showToast("✅ Todas as tarefas foram concluídas!");
    setTimeout(() => location.reload(), 2000);
  }

  try {
    await processAll();
  } catch (e) {
    showToast("❌ Erro ao processar tarefas: " + e.message, false);
    console.error(e);
  }

})();
