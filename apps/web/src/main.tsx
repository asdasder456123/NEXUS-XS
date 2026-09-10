import { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

type Section = {
  icon: string;
  name: string;
  description: string;
};

type ChatMessage = {
  role: "user" | "assistant";
  text: string;
};

const API_URL =
  import.meta.env.VITE_API_URL ??
  (import.meta.env.DEV ? "http://127.0.0.1:3000" : "");

const WS_URL =
  import.meta.env.VITE_WS_URL ??
  (import.meta.env.DEV
    ? "ws://127.0.0.1:3000/ws/chat"
    : `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/ws/chat`);

const sections: Section[] = [
  {
    icon: "⌂",
    name: "Home",
    description: "NΞXUS XS developer network.",
  },
  {
    icon: "💬",
    name: "Chat",
    description: "Public chat for NΞXUS XS users.",
  },
  {
    icon: "⚒",
    name: "Technical Support",
    description: "Company, technical support, and gaming communities.",
  },
  {
    icon: "◇",
    name: "News",
    description: "Documentation and knowledge.",
  },
  {
    icon: "□",
    name: "Minecraft Bot",
    description: "Minecraft bot workspace.",
  },
  {
    icon: "▣",
    name: "Resource Packs",
    description: "Minecraft resource packs published by NΞXUS XS users.",
  },
  {
    icon: "✦",
    name: "NΞXUS XS AI",
    description: "AI workspace powered by Groq.",
  },
  {
    icon: "⚒",
    name: "Rules",
    description: "NΞXUS XS rules and developer standards.",
  },
];

function App() {
  const [active, setActive] = useState("Home");
  const [search, setSearch] = useState("");
  const [loginOpen, setLoginOpen] = useState(false);

  const current =
    sections.find((section) => section.name === active) ?? sections[0];

  const results = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return sections;

    return sections.filter(
      (section) =>
        section.name.toLowerCase().includes(query) ||
        section.description.toLowerCase().includes(query),
    );
  }, [search]);

  function navigate(name: string) {
    setActive(name);
    setSearch("");
  }

  return (
    <div className="app">
      <header className="topbar">
        <button
          className="brand"
          type="button"
          onClick={() => navigate("Home")}
        >
          <span className="brand-mark">NΞ</span>
          <span>
            <strong>NΞXUS</strong>
            <small>XS</small>
          </span>
        </button>

        <div className="topbar-search">
          <span>⌕</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search NΞXUS XS..."
          />
          
        </div>

        
        

        <button className="discord-button" type="button">
          Discord <span>↗</span>
        </button>
</header>

      <div className="layout">
        <aside className="sidebar">
          <div className="sidebar-label">NETWORK</div>

          <nav>
            {sections.map((section) => (
              <button
                key={section.name}
                type="button"
                className={`nav-item ${
                  active === section.name ? "active" : ""
                }`}
                onClick={() => navigate(section.name)}
              >
                <span>{section.icon}</span>
                <label>{section.name}</label>
              </button>
            ))}
          </nav>

          <div className="sidebar-bottom">
            <div className="online-dot" />
            <span>Network online</span>
          </div>
        </aside>

        <main className="main">
          {search.trim() ? (
            <section className="search-results">
              <div className="eyebrow">SEARCH</div>
              <h1>Search results</h1>

              {results.length === 0 ? (
                <p className="page-description">
                  No NΞXUS XS sections match your search.
                </p>
              ) : (
                <div className="result-list">
                  {results.map((section) => (
                    <button
                      key={section.name}
                      type="button"
                      className="result-item"
                      onClick={() => navigate(section.name)}
                    >
                      <span>{section.icon}</span>
                      <div>
                        <strong>{section.name}</strong>
                        <small>{section.description}</small>
                      </div>
                      <b>→</b>
                    </button>
                  ))}
                </div>
              )}
            </section>
          ) : active === "Home" ? (
            <Home navigate={navigate} />
          ) : (
            <ServicePage section={current} />
          )}
        </main>
      </div>

      {loginOpen && (
        <div
          className="modal-backdrop"
          onClick={() => setLoginOpen(false)}
        >
          <div
            className="modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="modal-close"
              type="button"
              onClick={() => setLoginOpen(false)}
            >
              ×
            </button>

            <div className="eyebrow">NΞXUS XS</div>

            <h2>
              {authMode === "login"
                ? "تسجيل الدخول"
                : "إنشاء حساب"}
            </h2>

            <p>
              {authMode === "login"
                ? "سجّل الدخول إلى حسابك في NΞXUS XS."
                : "أنشئ حسابك الخاص داخل NΞXUS XS."}
            </p>

            <div className="auth-switch">
              <button
                type="button"
                onClick={() => setAuthMode("login")}
              >
                تسجيل الدخول
              </button>

              <button
                type="button"
                onClick={() => setAuthMode("register")}
              >
                إنشاء حساب
              </button>
            </div>

            <div className="auth-form">
              <label>
                اسم المستخدم
                <input
                  type="text"
                  value={authUsername}
                  onChange={(event) =>
                    setAuthUsername(event.target.value)
                  }
                  autoComplete="username"
                />
              </label>

              <label>
                كلمة المرور
                <input
                  type="password"
                  value={authPassword}
                  onChange={(event) =>
                    setAuthPassword(event.target.value)
                  }
                  autoComplete={
                    authMode === "login"
                      ? "current-password"
                      : "new-password"
                  }
                />
              </label>

              {authMode === "register" && (
                <label>
                  تأكيد كلمة المرور
                  <input
                    type="password"
                    value={authConfirmPassword}
                    onChange={(event) =>
                      setAuthConfirmPassword(event.target.value)
                    }
                    autoComplete="new-password"
                  />
                </label>
              )}

              {authError && (
                <div className="auth-error">
                  {authError}
                </div>
              )}

              <button
                className="primary-button"
                type="button"
                onClick={() => void submitAuth()}
                disabled={authLoading}
              >
                {authLoading
                  ? "جاري التنفيذ..."
                  : authMode === "login"
                    ? "دخول"
                    : "إنشاء الحساب"}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

function Home({ navigate }: {
  navigate: (name: string) => void;
}) {
  const cards = [
    {
      icon: "💬",
      title: "Chat",
      text: "Public chat for NΞXUS XS users.",
      action: "Chat",
    },
    {
      icon: "⚒",
      title: "Technical Support",
      text: "Company, technical support, and gaming communities.",
      action: "Technical Support",
    },
    {
      icon: "◇",
      title: "News",
      text: "Documentation, knowledge, guides, and references.",
      action: "News",
    },
    {
      icon: "□",
      title: "Minecraft Bot",
      text: "Minecraft bot workspace.",
      action: "Minecraft Bot",
    },
    {
      icon: "✦",
      title: "NΞXUS XS AI",
      text: "AI-assisted development and technical workspace.",
      action: "NΞXUS XS AI",
    },
    {
      icon: "⚒",
      title: "Rules",
      text: "Network rules, standards, and developer guidelines.",
      action: "Rules",
    },
  ];

  return (
    <section className="nexus-home">
      <div className="nexus-home-glow" />

      <div className="nexus-home-header">
        <div className="nexus-home-mark">NΞ</div>

        <div>
          <div className="nexus-home-kicker">NΞXUS XS</div>
          <h1>Developer Network</h1>
          <p>
            A private space for code, projects, documentation,
            resources, and AI-assisted development.
          </p>
        </div>
      </div>

      <div className="nexus-home-search">
        <span className="nexus-search-icon">⌕</span>
        <input
          type="search"
          placeholder="Search NΞXUS XS..."
          aria-label="Search NΞXUS XS"
        />
      </div>

      <div className="nexus-home-grid">
        {cards.map((card) => (
          <button
            key={card.title}
            className="nexus-home-card"
            onClick={() => navigate(card.action)}
          >
            <span className="nexus-home-card-icon">{card.icon}</span>

            <span className="nexus-home-card-body">
              <strong>{card.title}</strong>
              <small>{card.text}</small>
            </span>

            <span className="nexus-home-card-arrow">→</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function NewsPage() {
  type NewsItem = {
    id: string;
    title: string;
    description: string;
    url: string;
    image?: string;
    source?: string;
    author?: string;
    createdAt: string;
  };

  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loadingRef] = useState({
    current: false,
  });

  async function loadNews() {
    if (loadingRef.current) return;

    loadingRef.current = true;

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/api/news`);

      if (!response.ok) {
        throw new Error("Failed to load news");
      }

      const data = await response.json();

      setItems(Array.isArray(data.items) ? data.items : []);
      setError("");
    } catch (err) {
      console.error(err);
      setError("تعذر تحميل الأخبار.");
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }

  useEffect(() => {
    void loadNews();

    const timer = window.setInterval(() => {
      void loadNews();
    }, 5000);

    return () => window.clearInterval(timer);
  }, []);

  function formatDate(value: string) {
    return new Intl.DateTimeFormat("ar-EG", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  }

  return (
    <section className="service-page news-page">
      <div className="eyebrow">NΞXUS XS</div>

      <div className="news-header">
        <div>
          <h1>News</h1>
          <p className="page-description">
            آخر الأخبار والروابط التي تمت مشاركتها داخل شبكة NΞXUS XS.
          </p>
        </div>

        <button
          className="news-refresh-button"
          type="button"
          onClick={() => void loadNews()}
        >
          ↻ تحديث
        </button>
      </div>

      {loading && items.length === 0 ? (
        <div className="news-empty">
          <strong>جاري تحميل الأخبار...</strong>
        </div>
      ) : error ? (
        <div className="news-empty">
          <strong>{error}</strong>
          <button type="button" onClick={() => void loadNews()}>
            إعادة المحاولة
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="news-empty">
          <span className="news-empty-icon">◇</span>
          <strong>لا توجد أخبار حتى الآن</strong>
          <p>
            أرسل رابطًا في قناة Discord المخصصة وسيظهر هنا تلقائيًا.
          </p>
        </div>
      ) : (
        <div className="news-grid">
          {items.map((item) => (
            <article className="news-card" key={item.id}>
              {item.image ? (
                <div className="news-card-image">
                  <img
                    src={item.image}
                    alt=""
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.parentElement?.remove();
                    }}
                  />
                </div>
              ) : null}

              <div className="news-card-content">
                <div className="news-card-meta">
                  <span>{item.source ?? "Web"}</span>
                  <span>{formatDate(item.createdAt)}</span>
                </div>

                <h2>{item.title}</h2>

                <p>
                  {item.description || "لا يوجد وصف متاح لهذا الخبر."}
                </p>

                {item.author ? (
                  <small className="news-card-author">
                    شاركه {item.author}
                  </small>
                ) : null}

                <a
                  className="news-card-link"
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  فتح الخبر <span>→</span>
                </a>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function TechnicalSupportPage() {
  const links = [
    {
      icon: "◆",
      title: "Company Discord",
      description: "Official NΞXUS XS company Discord server.",
      url: "https://discord.gg/bcXQBFNCSz",
    },
    {
      icon: "⚒",
      title: "Technical Support",
      description: "Get technical help and support from our team.",
      url: "https://discord.gg/Tvd5pg3h",
    },
    {
      icon: "🎮",
      title: "Gaming Community",
      description: "Discord community dedicated to gaming.",
      url: "https://discord.gg/ubqj6f5YRf",
    },
  ];

  return (
    <section className="service-page support-page">
      <div className="eyebrow">NΞXUS XS</div>

      <div className="support-header">
        <h1>Technical Support</h1>
        <p className="page-description">
          Official NΞXUS XS Discord communities and support channels.
        </p>
      </div>

      <div className="support-grid">
        {links.map((link) => (
          <a
            className="support-card"
            key={link.title}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className="support-card-icon">{link.icon}</div>

            <div className="support-card-content">
              <h2>{link.title}</h2>
              <p>{link.description}</p>
            </div>

            <span className="support-card-arrow">→</span>
          </a>
        ))}
      </div>
    </section>
  );
}


type PublicChatMessage = {
  id: string;
  authorId: string;
  author: string;
  avatar?: string;
  text: string;
  createdAt: string;
};

type CurrentUser = {
  id: string;
  username: string;
  avatar?: string;
};

function ChatPage() {
  const [messages, setMessages] = useState<PublicChatMessage[]>([]);
  const [message, setMessage] = useState("");
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadHistory() {
      try {
        const response = await fetch(`${API_URL}/api/chat/messages`);
        const data = await response.json();

        if (!response.ok || !data.ok) {
          throw new Error(data.error ?? "Failed to load chat");
        }

        if (!cancelled) {
          setMessages(
            Array.isArray(data.messages) ? data.messages : [],
          );
          setError("");
        }
      } catch (error) {
        console.error("[Chat] History error:", error);

        if (!cancelled) {
          setError("تعذر تحميل سجل الشات.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    async function loadUser() {
      try {
        const response = await fetch(`${API_URL}/auth/me`);
        const data = await response.json();

        if (
          !cancelled &&
          data.authenticated &&
          data.user
        ) {
          setCurrentUser(data.user);
        }
      } catch (error) {
        console.error("[Chat] User lookup failed:", error);
      }
    }

    void loadHistory();
    void loadUser();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const socket = new WebSocket(WS_URL);

    socket.onopen = () => {
      setConnected(true);
      setError("");
    };

    socket.onclose = () => {
      setConnected(false);
    };

    socket.onerror = () => {
      setConnected(false);
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "message" && data.message) {
          setMessages((current) => {
            if (
              current.some(
                (item) => item.id === data.message.id,
              )
            ) {
              return current;
            }

            return [
              ...current,
              data.message,
            ].slice(-100);
          });
        }

        if (data.type === "error") {
          setError(
            typeof data.error === "string"
              ? data.error
              : "تعذر إرسال الرسالة.",
          );
        }
      } catch (error) {
        console.error("[Chat] Invalid WebSocket data:", error);
      }
    };

    return () => {
      socket.close();
    };
  }, []);

  useEffect(() => {
    const container = document.querySelector(
      ".public-chat-messages",
    );

    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]);

  async function sendMessage() {
    const text = message.trim();

    if (!text || text.length > 2000 || sending) {
      return;
    }

    setSending(true);
    setError("");

    const socket = new WebSocket(WS_URL);

    socket.onopen = () => {
      socket.send(
        JSON.stringify({
          type: "message",
          text,
          user:
            currentUser ?? {
              id: "guest",
              username: "Guest",
            },
        }),
      );

      setMessage("");

      window.setTimeout(() => {
        socket.close();
      }, 500);
    };

    socket.onerror = () => {
      setError("تعذر الاتصال بالشات.");
      setSending(false);
      socket.close();
    };

    socket.onclose = () => {
      setSending(false);
    };
  }

  function formatTime(value: string) {
    return new Intl.DateTimeFormat("ar-EG", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  }

  return (
    <section className="service-page public-chat-page">
      <div className="eyebrow">NΞXUS XS</div>

      <div className="public-chat-header">
        <div>
          <h1>Chat</h1>
          <p className="page-description">
            Public chat for NΞXUS XS users.
          </p>
        </div>

        <div
          className={`chat-status ${
            connected ? "online" : ""
          }`}
        >
          <span />
          {connected ? "Live" : "Connecting..."}
        </div>
      </div>

      <div className="public-chat-shell">
        <div className="public-chat-messages">
          {loading ? (
            <div className="public-chat-empty">
              جاري تحميل الشات...
            </div>
          ) : messages.length === 0 ? (
            <div className="public-chat-empty">
              <span>💬</span>
              <strong>لا توجد رسائل حتى الآن</strong>
              <p>
                ابدأ أول محادثة في NΞXUS XS.
              </p>
            </div>
          ) : (
            messages.map((item) => {
              const own =
                item.authorId === currentUser?.id;

              return (
                <article
                  className={`public-chat-message ${
                    own ? "own" : ""
                  }`}
                  key={item.id}
                >
                  <div className="public-chat-avatar">
                    {item.avatar ? (
                      <img
                        src={item.avatar}
                        alt=""
                      />
                    ) : (
                      item.author
                        .slice(0, 1)
                        .toUpperCase()
                    )}
                  </div>

                  <div className="public-chat-message-body">
                    <div className="public-chat-message-meta">
                      <strong>{item.author}</strong>
                      <span>
                        {formatTime(item.createdAt)}
                      </span>
                    </div>

                    <p>{item.text}</p>
                  </div>
                </article>
              );
            })
          )}
        </div>

        <div className="public-chat-composer">
          <textarea
            value={message}
            maxLength={2000}
            rows={2}
            onChange={(event) =>
              setMessage(event.target.value)
            }
            onKeyDown={(event) => {
              if (
                event.key === "Enter" &&
                !event.shiftKey
              ) {
                event.preventDefault();
                void sendMessage();
              }
            }}
            placeholder="اكتب رسالتك..."
            disabled={sending}
          />

          <div className="public-chat-composer-bottom">
            <span>
              {currentUser
                ? `أنت: ${currentUser.username}`
                : "Guest"}
              {" · "}
              {message.length}/2000
            </span>

            <button
              type="button"
              onClick={() => void sendMessage()}
              disabled={
                sending || !message.trim()
              }
            >
              {sending ? "إرسال..." : "إرسال"}
              <span>→</span>
            </button>
          </div>
        </div>
      </div>

      {error ? (
        <div className="public-chat-error">
          {error}
        </div>
      ) : null}
    </section>
  );
}

function ServicePage({ section }: { section: Section }) {
  if (section.name === "Chat") {
    return <ChatPage />;
  }

  if (section.name === "NΞXUS XS AI") {
    return <AIWorkspace />;
  }

  if (section.name === "Minecraft Bot") {
    return <MinecraftBotWorkspace />;
  }

  if (section.name === "Resource Packs") {
    return <ResourcePacksPage />;
  }

  if (section.name === "Rules") {
    return <RulesPage />;
  }

  if (section.name === "News") {
    return <NewsPage />;
  }


  if (section.name === "Technical Support") {
    return <TechnicalSupportPage />;
  }

  return (
    <section className="service-page">
      <div className="eyebrow">NΞXUS XS</div>
      <h1>{section.name}</h1>
      <p className="page-description">
        هذا القسم جاهز للتطوير وسيتم بناء وظائفه ضمن مراحل NΞXUS XS.
      </p>
    </section>
  );
}



type ResourcePack = {
  id: string;
  name: string;
  description: string;
  minecraftVersion: string;
  category: string;
  author: string;
  image?: string;
  downloadUrl?: string;
  createdAt: string;
};

function ResourcePacksPage() {
  const [packs, setPacks] = useState<ResourcePack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [publishOpen, setPublishOpen] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [minecraftVersion, setMinecraftVersion] = useState("1.21");
  const [category, setCategory] = useState("Faithful");
  const [image, setImage] = useState<File | null>(null);
  const [packFile, setPackFile] = useState<File | null>(null);
  const [publishing, setPublishing] = useState(false);

  async function loadPacks() {
    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/api/resource-packs`);
      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? "Failed to load resource packs");
      }

      setPacks(Array.isArray(data.packs) ? data.packs : []);
      setError("");
    } catch (err) {
      console.error("[Resource Packs] Load error:", err);
      setError("تعذر تحميل Resource Packs حاليًا.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPacks();
  }, []);

  function resetPublishForm() {
    setName("");
    setDescription("");
    setMinecraftVersion("1.21");
    setCategory("Faithful");
    setImage(null);
    setPackFile(null);
  }

  function closePublish() {
    if (publishing) return;

    setPublishOpen(false);
    resetPublishForm();
  }

  async function publishPack() {
    const trimmedName = name.trim();
    const trimmedDescription = description.trim();

    if (!trimmedName || !trimmedDescription || !packFile) {
      setError("أكمل اسم الحزمة والوصف واختر ملف ZIP.");
      return;
    }

    if (!packFile.name.toLowerCase().endsWith(".zip")) {
      setError("يجب أن يكون Resource Pack بصيغة ZIP.");
      return;
    }

    setPublishing(true);
    setError("");

    try {
      const formData = new FormData();

      formData.append("name", trimmedName);
      formData.append("description", trimmedDescription);
      formData.append("minecraftVersion", minecraftVersion);
      formData.append("category", category);
      formData.append("pack", packFile);

      if (image) {
        formData.append("image", image);
      }

      const response = await fetch(
        `${API_URL}/api/resource-packs`,
        {
          method: "POST",
          body: formData,
        },
      );

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(
          data.error ?? "Failed to publish resource pack",
        );
      }

      closePublish();
      await loadPacks();
    } catch (err) {
      console.error("[Resource Packs] Publish error:", err);
      setError("تعذر نشر Resource Pack حاليًا.");
    } finally {
      setPublishing(false);
    }
  }

  return (
    <section className="service-page resource-packs-page">
      <div className="eyebrow">MINECRAFT</div>

      <div className="resource-packs-header">
        <div>
          <h1>Resource Packs</h1>
          <p className="page-description">
            Minecraft Resource Packs published by NΞXUS XS users.
          </p>
        </div>

        <button
          className="resource-pack-publish-button"
          type="button"
          onClick={() => setPublishOpen(true)}
        >
          <span>＋</span>
          Publish Pack
        </button>
      </div>

      {error ? (
        <div className="resource-packs-error">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="resource-packs-empty">
          <strong>Loading Resource Packs...</strong>
        </div>
      ) : packs.length === 0 ? (
        <div className="resource-packs-empty">
          <div className="resource-packs-empty-icon">▣</div>
          <strong>No Resource Packs yet</strong>
          <p>
            Be the first developer to publish a Minecraft Resource Pack.
          </p>

          <button
            className="primary-button"
            type="button"
            onClick={() => setPublishOpen(true)}
          >
            ＋ Publish your first pack
          </button>
        </div>
      ) : (
        <div className="resource-packs-grid">
          {packs.map((pack) => (
            <article className="resource-pack-card" key={pack.id}>
              {pack.image ? (
                <div className="resource-pack-card-image">
                  <img
                    src={pack.image}
                    alt=""
                    loading="lazy"
                  />
                </div>
              ) : (
                <div className="resource-pack-card-placeholder">
                  ▣
                </div>
              )}

              <div className="resource-pack-card-content">
                <div className="resource-pack-card-meta">
                  <span>{pack.minecraftVersion}</span>
                  <span>{pack.category}</span>
                </div>

                <h2>{pack.name}</h2>

                <p>{pack.description}</p>

                <small>
                  Published by {pack.author}
                </small>

                {pack.downloadUrl ? (
                  <a
                    className="resource-pack-download"
                    href={pack.downloadUrl}
                    download
                  >
                    Download <span>↓</span>
                  </a>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}

      {publishOpen ? (
        <div
          className="modal-backdrop"
          onClick={closePublish}
        >
          <div
            className="modal resource-pack-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="modal-close"
              type="button"
              onClick={closePublish}
            >
              ×
            </button>

            <div className="eyebrow">MINECRAFT</div>

            <h2>Publish Resource Pack</h2>

            <p>
              Share your Minecraft Resource Pack with NΞXUS XS users.
            </p>

            <div className="auth-form">
              <label>
                Pack Name
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  maxLength={100}
                  placeholder="My Resource Pack"
                />
              </label>

              <label>
                Description
                <textarea
                  value={description}
                  onChange={(event) =>
                    setDescription(event.target.value)
                  }
                  maxLength={1000}
                  rows={4}
                  placeholder="Describe your Resource Pack..."
                />
              </label>

              <label>
                Minecraft Version
                <select
                  value={minecraftVersion}
                  onChange={(event) =>
                    setMinecraftVersion(event.target.value)
                  }
                >
                  <option value="1.21">1.21</option>
                  <option value="1.20.6">1.20.6</option>
                  <option value="1.20.4">1.20.4</option>
                  <option value="1.20.1">1.20.1</option>
                  <option value="1.19.4">1.19.4</option>
                  <option value="Other">Other</option>
                </select>
              </label>

              <label>
                Category
                <select
                  value={category}
                  onChange={(event) =>
                    setCategory(event.target.value)
                  }
                >
                  <option value="Faithful">Faithful</option>
                  <option value="PvP">PvP</option>
                  <option value="Vanilla">Vanilla</option>
                  <option value="Realistic">Realistic</option>
                  <option value="Fantasy">Fantasy</option>
                  <option value="GUI">GUI</option>
                  <option value="Other">Other</option>
                </select>
              </label>

              <label>
                Pack Image
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(event) =>
                    setImage(event.target.files?.[0] ?? null)
                  }
                />
              </label>

              <label>
                Resource Pack ZIP
                <input
                  type="file"
                  accept=".zip,application/zip"
                  onChange={(event) =>
                    setPackFile(event.target.files?.[0] ?? null)
                  }
                />
              </label>

              <button
                className="primary-button"
                type="button"
                onClick={() => void publishPack()}
                disabled={publishing}
              >
                {publishing
                  ? "Publishing..."
                  : "Publish Resource Pack"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function RulesPage() {
  const rules = [
    "احترام حقوق أصحاب المشاريع والمحتوى.",
    "يجب توضيح مصدر أي كود أو مشروع خارجي.",
    "احترام شروط التراخيص الأصلية.",
    "لا تنسب عمل شخص آخر إلى نفسك.",
    "لا ترفع محتوى مجهول المصدر على أنه ملكك.",
    "أي Fork يجب أن يحافظ على متطلبات الترخيص.",
    "أضف الاعتمادات المطلوبة للمطورين والمساهمين.",
    "يُمنع انتحال هوية المطورين أو المشاريع.",
    "يُمنع استخدام الشبكة لنشر محتوى ضار أو غير قانوني.",
    "الشفافية مطلوبة عند مشاركة المشاريع والأدوات.",
  ];

  return (
    <section className="service-page rules-page">
      <div className="eyebrow">NETWORK POLICY</div>
      <h1>NΞXUS XS Rules</h1>
      <p className="page-description">
        قواعد أساسية للحفاظ على بيئة تطوير منظمة وموثوقة.
      </p>

      <div className="rules-grid">
        {rules.map((rule, index) => (
          <article className="rule-card" key={rule}>
            <span className="rule-number">
              {String(index + 1).padStart(2, "0")}
            </span>
            <p>{rule}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

type StoredMessageLike = {
  role: "user" | "assistant";
  text: string;
};

function AIWorkspace() {
  type Session = {
    id: string;
    title: string;
    createdAt: string;
    updatedAt: string;
    messageCount: number;
  };

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const [clientId] = useState(() => {
    const key = "nexus-xs-ai-client-id";
    const saved = localStorage.getItem(key);

    if (saved) return saved;

    const id =
      typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`;

    localStorage.setItem(key, id);
    return id;
  });

  async function loadSessions() {
    try {
      const response = await fetch(`${API_URL}/api/ai/sessions`, {
        headers: {
          "x-nexus-client-id": clientId,
        },
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? "Failed to load sessions");
      }

      const loaded: Session[] = data.sessions ?? [];
      setSessions(loaded);

      if (!activeSessionId && loaded.length > 0) {
        await openSession(loaded[0].id);
      }
    } catch (error) {
      console.error("Failed to load AI sessions:", error);
    }
  }

  async function createNewSession() {
    try {
      const response = await fetch(`${API_URL}/api/ai/sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-nexus-client-id": clientId,
        },
        body: JSON.stringify({
          title: "New conversation",
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? "Failed to create session");
      }

      const session = data.session;

      setSessions((current) => [
        {
          id: session.id,
          title: session.title,
          createdAt: session.createdAt,
          updatedAt: session.updatedAt,
          messageCount: 0,
        },
        ...current,
      ]);

      setActiveSessionId(session.id);
      setMessages([]);
      setMessage("");
    } catch (error) {
      console.error("Failed to create AI session:", error);
    }
  }

  async function openSession(sessionId: string) {
    try {
      const response = await fetch(
        `${API_URL}/api/ai/sessions/${sessionId}`,
        {
          headers: {
            "x-nexus-client-id": clientId,
          },
        },
      );

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? "Failed to open session");
      }

      setActiveSessionId(sessionId);

      setMessages(
        (data.session.messages ?? []).map(
          (item: StoredMessageLike) => ({
            role: item.role,
            text: item.text,
          }),
        ),
      );

      setMessage("");
    } catch (error) {
      console.error("Failed to open AI session:", error);
    }
  }

  async function deleteSession(
    event: React.MouseEvent,
    sessionId: string,
  ) {
    event.stopPropagation();

    try {
      const response = await fetch(
        `${API_URL}/api/ai/sessions/${sessionId}`,
        {
          method: "DELETE",
          headers: {
            "x-nexus-client-id": clientId,
          },
        },
      );

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? "Failed to delete session");
      }

      const remaining = sessions.filter(
        (item) => item.id !== sessionId,
      );

      setSessions(remaining);

      if (activeSessionId === sessionId) {
        if (remaining.length > 0) {
          await openSession(remaining[0].id);
        } else {
          await createNewSession();
        }
      }
    } catch (error) {
      console.error("Failed to delete AI session:", error);
    }
  }

  async function sendMessage() {
    const value = message.trim();

    if (!value || loading) return;

    let sessionId = activeSessionId;

    try {
      if (!sessionId) {
        const response = await fetch(
          `${API_URL}/api/ai/sessions`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-nexus-client-id": clientId,
            },
            body: JSON.stringify({
              title: "New conversation",
            }),
          },
        );

        const data = await response.json();

        if (!response.ok || !data.ok) {
          throw new Error(
            data.error ?? "Failed to create session",
          );
        }

        sessionId = data.session.id;
        setActiveSessionId(sessionId);

        setSessions((current) => [
          {
            id: data.session.id,
            title: data.session.title,
            createdAt: data.session.createdAt,
            updatedAt: data.session.updatedAt,
            messageCount: 0,
          },
          ...current,
        ]);
      }

      setMessage("");
      setMessages((current) => [
        ...current,
        {
          role: "user",
          text: value,
        },
      ]);

      setLoading(true);

      const response = await fetch(
        `${API_URL}/api/ai/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-nexus-client-id": clientId,
          },
          body: JSON.stringify({
            sessionId,
            message: value,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? "AI request failed");
      }

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: data.reply || "لم يصل رد من النموذج.",
        },
      ]);

      await loadSessions();
    } catch (error) {
      console.error("NΞXUS XS AI error:", error);

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text:
            "تعذر الاتصال بخدمة NΞXUS XS AI. تأكد أن الـAPI يعمل وأن اتصال Groq متاح.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSessions();
  }, []);

  return (
    <section className="ai-workspace">
      <div className="ai-header">
        <div>
          <div className="eyebrow">AI DEVELOPMENT WORKSPACE</div>
          <h1>NΞXUS XS AI</h1>
          <p>مساعد تطوير حقيقي متصل بالـNΞXUS XS API.</p>
        </div>

        <div className="ai-status">
          <span />
          <div>
            <strong>ONLINE</strong>
            <small>Groq / GPT-OSS 120B</small>
          </div>
        </div>
      </div>

      <div className="ai-layout">
        <aside className="ai-projects">
          <div className="ai-panel-title">CONVERSATIONS</div>

          <button
            className="ai-project active"
            type="button"
            onClick={() => void createNewSession()}
          >
            <span>+</span>
            <div>
              <strong>New conversation</strong>
              <small>Start a new AI session</small>
            </div>
          </button>

          <div className="ai-session-list">
            {sessions.map((session) => (
              <button
                key={session.id}
                className={`ai-project ${
                  activeSessionId === session.id ? "active" : ""
                }`}
                type="button"
                onClick={() => void openSession(session.id)}
              >
                <span>◈</span>

                <div>
                  <strong>{session.title}</strong>
                  <small>{session.messageCount} messages</small>
                </div>

                <b
                  className="ai-session-delete"
                  onClick={(event) =>
                    void deleteSession(event, session.id)
                  }
                >
                  ×
                </b>
              </button>
            ))}
          </div>

          <button className="ai-project" type="button">
            <span>◆</span>
            <div>
              <strong>New project</strong>
              <small>Create with NΞXUS XS AI</small>
            </div>
          </button>
        </aside>

        <div className="ai-chat">
          <div className="ai-chat-head">
            <div>
              <strong>NΞXUS XS AI</strong>
              <span>
                {sessions.find(
                  (session) => session.id === activeSessionId,
                )?.title ?? "Developer Assistant"}
              </span>
            </div>

            <div className="ai-model">GPT-OSS 120B</div>
          </div>

          <div className="ai-messages">
            {messages.length === 0 && (
              <div className="ai-message assistant">
                <div className="ai-avatar">NΞ</div>
                <div className="ai-bubble">
                  مرحبًا بك في NΞXUS XS AI. هذه جلسة جديدة.
                  ابدأ المحادثة وسيتم حفظها تلقائيًا لتتمكن
                  من العودة إليها ومتابعتها لاحقًا.
                </div>
              </div>
            )}

            {messages.map((item, index) => (
              <div
                key={`${item.role}-${index}`}
                className={`ai-message ${item.role}`}
              >
                <div className="ai-avatar">
                  {item.role === "assistant" ? "NΞ" : "YOU"}
                </div>

                <div className="ai-bubble">{item.text}</div>
              </div>
            ))}

            {loading && (
              <div className="ai-message assistant">
                <div className="ai-avatar">NΞ</div>
                <div className="ai-bubble ai-thinking">
                  NΞXUS XS AI is thinking...
                </div>
              </div>
            )}
          </div>

          <div className="ai-composer">
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void sendMessage();
                }
              }}
              placeholder="Talk to NΞXUS XS AI..."
              rows={3}
              disabled={loading}
            />

            <div className="ai-composer-bottom">
              <span>Enter to send · Shift + Enter for new line</span>

              <button
                type="button"
                onClick={() => void sendMessage()}
                disabled={loading || !message.trim()}
              >
                {loading ? "Thinking..." : "Send"}
                <span>→</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}



function MinecraftBotWorkspace() {
  type MinecraftChatMessage = {
    id: number;
    role: "user" | "assistant";
    author: string;
    text: string;
    createdAt: string;
  };

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<MinecraftChatMessage[]>([]);
  const [sending, setSending] = useState(false);

  const [clientId] = useState(() => {
    const key = "nexus-xs-minecraft-bot-client-id";
    const saved = localStorage.getItem(key);

    if (saved) return saved;

    const id =
      typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`;

    localStorage.setItem(key, id);
    return id;
  });

  async function loadMessages() {
    try {
      const response = await fetch(
        `${API_URL}/api/minecraft-bot/chat`,
      );

      const data = await response.json();

      if (data.ok) {
        setMessages(data.messages ?? []);
      }
    } catch (error) {
      console.error("Failed to load Minecraft Bot chat:", error);
    }
  }

  async function sendMessage() {
    const value = message.trim();

    if (!value || sending) return;

    setMessage("");
    setSending(true);

    try {
      const response = await fetch(
        `${API_URL}/api/minecraft-bot/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-nexus-client-id": clientId,
          },
          body: JSON.stringify({
            text: value,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? "Failed to send message");
      }

      await loadMessages();
    } catch (error) {
      console.error("Failed to send Minecraft Bot message:", error);
    } finally {
      setSending(false);
    }
  }

  useEffect(() => {
    void loadMessages();

    const interval = window.setInterval(() => {
      void loadMessages();
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  return (
    <section className="service-page ai-page minecraft-bot-page">
      <div className="eyebrow">MINECRAFT BOT</div>

      <div className="ai-chat minecraft-bot-chat">
        <div className="ai-chat-head">
          <div>
            <strong>Minecraft Bot</strong>
            <span>Shared Minecraft bot workspace</span>
          </div>

          <div className="ai-model">MINEFLAYER</div>
        </div>

        <div className="ai-messages">
          {messages.length === 0 && (
            <div className="ai-message assistant">
              <div className="ai-avatar">MC</div>

              <div className="ai-bubble">
                مرحبًا. لإنشاء Minecraft Bot اكتب الأمر كاملًا في رسالة واحدة:<br />
                <strong>!start IP PORT BOT_NAME</strong>
              </div>
            </div>
          )}

          {messages.map((item) => (
            <div
              key={item.id}
              className={`ai-message ${item.role}`}
            >
              <div className="ai-avatar">
                {item.role === "assistant"
                  ? "MC"
                  : item.author === "YOU"
                    ? "YOU"
                    : item.author}
              </div>

              <div className="ai-bubble">
                {item.text}
              </div>
            </div>
          ))}

          {sending && (
            <div className="ai-message assistant">
              <div className="ai-avatar">MC</div>

              <div className="ai-bubble ai-thinking">
                Minecraft Bot is processing...
              </div>
            </div>
          )}
        </div>

        <div className="ai-composer">
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void sendMessage();
              }
            }}
            placeholder="!start IP PORT BOT_NAME أو !cmd IP PORT BOT_NAME /login PASSWORD"
            rows={3}
            disabled={sending}
          />

          <div className="ai-composer-bottom">
            <span>
              Enter to send · Shift + Enter for new line
            </span>

            <button
              type="button"
              onClick={() => void sendMessage()}
              disabled={sending || !message.trim()}
            >
              {sending ? "Sending..." : "Send"}
              <span>→</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

type DotFileEntry = {
  name: string;
  path: string;
  type: "file" | "directory";
  size: number;
  modifiedAt: string;
};


createRoot(document.getElementById("root")!).render(<App />);
