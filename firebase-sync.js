import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { getDatabase, onValue, ref, remove, update } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-database.js";
import { firebaseConfig, OWNER_UID } from "./firebase-config.js";

const fields = [...document.querySelectorAll("[data-save]")];
const status = document.querySelector("#share-status");
const note = document.querySelector("#local-save-note");
const loginButton = document.querySelector("#edit-open");
const signoutButton = document.querySelector("#edit-signout");
const importButton = document.querySelector("#import-local");
const clearButton = document.querySelector("#clear");
const saved = document.querySelector("#saved");

fields.forEach(field => { field.readOnly = true; });
clearButton.hidden = true;

function setStatus(message, state = "") {
  status.textContent = message;
  status.dataset.state = state;
}

const configured = Object.entries(firebaseConfig).every(([key, value]) =>
  typeof value === "string" && value.length > 0 && !value.startsWith("REPLACE_WITH")
);

if (location.protocol === "file:") {
  // A local file cannot complete OAuth. Keep it editable as a private draft only.
  fields.forEach(field => { field.readOnly = false; });
  clearButton.hidden = false;
  setStatus("本机草稿 · 不会共享");
  note.textContent = "当前是本机预览：可填写并保存在这台设备，但朋友看不到。要修改共享版本，请打开 GitHub 网页并以行程主人 Google 账号登录。";
  loginButton.hidden = true;
  saved.textContent = "本机自动保存已开启";
} else if (!configured) {
  setStatus("共享数据库待配置");
  note.textContent = "共享尚未连接。完成 Firebase 配置后，朋友可免登录查看，只有行程主人能编辑。";
  loginButton.hidden = true;
} else {
  note.textContent = "共享内容从 Firebase 实时读取；仅已授权的行程主人可以修改。";
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const database = getDatabase(app);
  const fieldsRef = ref(database, "tripData/fields");
  let isOwner = false;
  let firstSnapshot = true;
  let pendingWrites = new Map();
  let sharedValues = {};

  onValue(fieldsRef, snapshot => {
    sharedValues = snapshot.val() || {};
    fields.forEach(field => {
      if (document.activeElement !== field) {
        field.value = sharedValues[field.dataset.save] ?? "";
      }
    });
    if (firstSnapshot) {
      firstSnapshot = false;
      setStatus("共享行程已连接", "online");
    }
  }, error => {
    setStatus("共享数据读取失败，请稍后重试", "error");
    note.textContent = error.message;
  });

  onAuthStateChanged(auth, user => {
    isOwner = Boolean(user && user.uid === OWNER_UID);
    fields.forEach(field => { field.readOnly = !isOwner; });
    clearButton.hidden = !isOwner;
    importButton.hidden = !isOwner;
    signoutButton.hidden = !user;
    loginButton.hidden = isOwner;
    if (isOwner) {
      setStatus("已登录 · 你可以编辑", "online");
      note.textContent = "你的修改会保存到共享行程，并同步给正在查看的朋友。";
    } else if (user) {
      setStatus(OWNER_UID.startsWith("REPLACE_WITH") ? "已登录 · 等待绑定编辑者" : "当前账号只有查看权限");
      note.textContent = OWNER_UID.startsWith("REPLACE_WITH")
        ? `账号已连接。请在 Firebase Authentication 用户列表复制 UID ${user.uid}，配置为唯一编辑者后再开放共享。`
        : "此账号未获编辑权限；共享规则只允许行程主人写入。";
    } else {
      setStatus("共享行程已连接 · 只读", "online");
      note.textContent = "朋友无需登录即可查看；编辑前请用行程主人账号登录。";
    }
  });

  loginButton.addEventListener("click", async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (error) {
      const messages = {
        "auth/operation-not-allowed": "Firebase 尚未启用 Google 登录；请先在 Authentication 中开启 Google 提供方。",
        "auth/unauthorized-domain": "当前网页域名未获 Firebase 授权；请在 Authentication 的授权网域中添加此网站域名。",
        "auth/operation-not-supported-in-this-environment": "当前打开方式不支持 Google 登录；请通过 http:// 或 https:// 网站网址打开，不要使用 file:// 本地文件。",
        "auth/popup-blocked": "浏览器拦截了 Google 登录弹窗；请允许此网站打开弹窗后重试。",
        "auth/popup-closed-by-user": "Google 登录窗口已关闭，尚未完成登录。",
        "auth/network-request-failed": "网络连接失败；请检查网络后重试。"
      };
      const code = error?.code || "unknown";
      setStatus(messages[code] || `Google 登录失败（${code}）；请检查 Firebase Authentication 配置。`, "error");
    }
  });
  document.querySelector("#edit-signout").addEventListener("click", () => signOut(auth));

  fields.forEach(field => field.addEventListener("input", () => {
    if (!isOwner) return;
    const key = field.dataset.save;
    localStorage.setItem("kyushu-trip-" + key, field.value);
    window.clearTimeout(pendingWrites.get(key));
    saved.textContent = "正在同步…";
    const timeout = window.setTimeout(async () => {
      try {
        await update(fieldsRef, { [key]: field.value });
        saved.textContent = "已同步 " + new Date().toLocaleTimeString();
      } catch {
        saved.textContent = "同步失败；输入仍保存在本机，请检查网络／权限";
      }
    }, 300);
    pendingWrites.set(key, timeout);
  }));

  importButton.addEventListener("click", async () => {
    if (!isOwner) return;
    const localValues = Object.fromEntries(fields
      .map(field => [field.dataset.save, localStorage.getItem("kyushu-trip-" + field.dataset.save) || ""])
      .filter(([, value]) => value.trim()));
    if (!Object.keys(localValues).length) {
      saved.textContent = "这台设备没有旧填写内容";
      return;
    }
    if (!confirm("把这台设备已有的填写内容合并到共享行程吗？同名项目会以本机内容覆盖。")) return;
    try {
      await update(fieldsRef, localValues);
      saved.textContent = "旧填写内容已同步";
    } catch {
      saved.textContent = "导入失败，请检查网络／权限";
    }
  });

  document.addEventListener("clear-local-accepted", async () => {
    if (!isOwner) return;
    try {
      await remove(fieldsRef);
      saved.textContent = "共享填写内容已清空";
    } catch {
      saved.textContent = "清空共享内容失败，请检查网络／权限";
    }
  });
}
