import { createContext, useContext, useEffect, useRef, useState, useCallback, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { Link } from "@tanstack/react-router";
import { useCollectionOwner } from "../../api/queries";
import { useAuth } from "../../auth/AuthContext";
import { SetupGuide } from "../SetupGuide";
import { EditNameModal } from "../EditNameModal";
import { Toaster } from "react-hot-toast";
import { SaveBar } from "../SaveBar";
import { hasChanges, subscribe } from "../../store/pendingChanges";

const PageHeaderPortalContext = createContext<HTMLDivElement | null>(null);
const StickyOffsetContext = createContext<number>(0);

export function useStickyOffset() {
  return useContext(StickyOffsetContext);
}

export function PageHeader({ children }: { children: React.ReactNode }) {
  const container = useContext(PageHeaderPortalContext);
  if (!container) return null;
  return createPortal(children, container);
}

export function PageLayout({ children }: { children: React.ReactNode }) {
  const { data: ownerName } = useCollectionOwner();
  const { user, isOwner, logout, isLoading: authLoading } = useAuth();
  const [showSetup, setShowSetup] = useState(false);
  const [showEditName, setShowEditName] = useState(false);
  const pendingChanges = useSyncExternalStore(subscribe, hasChanges);
  const showSaveBar = user && isOwner && pendingChanges;

  useEffect(() => {
    document.title = ownerName
      ? `${ownerName}'s Collection`
      : "Pokemon Collection";
  }, [ownerName]);
  const [headerEl, setHeaderEl] = useState<HTMLDivElement | null>(null);
  const observerRef = useRef<MutationObserver | null>(null);
  const [hasContent, setHasContent] = useState(false);
  const [stickyOffset, setStickyOffset] = useState(0);
  const headerWrapperRef = useRef<HTMLDivElement | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  const headerWrapperCallback = useCallback((node: HTMLDivElement | null) => {
    if (resizeObserverRef.current) {
      resizeObserverRef.current.disconnect();
      resizeObserverRef.current = null;
    }
    headerWrapperRef.current = node;
    if (node) {
      const update = () => {
        setStickyOffset(node.offsetHeight);
      };
      resizeObserverRef.current = new ResizeObserver(update);
      resizeObserverRef.current.observe(node);
      update();
    }
  }, []);

  const headerRef = useCallback((node: HTMLDivElement | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    setHeaderEl(node);

    if (node) {
      setHasContent(node.childNodes.length > 0);
      observerRef.current = new MutationObserver(() => {
        setHasContent(node.childNodes.length > 0);
      });
      observerRef.current.observe(node, { childList: true });
    }
  }, []);

  return (
    <PageHeaderPortalContext.Provider value={headerEl}>
      <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
        <nav className="flex-shrink-0 bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Link to="/" className="text-xl font-bold text-gray-900">
                  {ownerName ? `${ownerName}'s Collection` : "Pokemon Collection"}
                </Link>
                {user && isOwner && (
                  <button
                    onClick={() => setShowEditName(true)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    title="Edit collection name"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
                    </svg>
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
                {user && isOwner ? (
                  <>
                    <img
                      src={user.avatar_url}
                      alt={user.login}
                      className="w-7 h-7 rounded-full"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                    <span className="text-sm text-gray-600">{user.login}</span>
                    <button
                      onClick={logout}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      Sign out
                    </button>
                  </>
                ) : authLoading ? (
                  <span className="text-sm text-gray-400">Connecting...</span>
                ) : (
                  <button
                    onClick={() => setShowSetup(true)}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Sign in to edit
                  </button>
                )}
              </div>
            </div>
          </div>
        </nav>
        <main
          className="flex-1 overflow-y-auto"
          ref={useCallback((node: HTMLElement | null) => {
            if (!node) return;
            let timer: ReturnType<typeof setTimeout>;
            node.addEventListener('scroll', () => {
              node.classList.add('is-scrolling');
              clearTimeout(timer);
              timer = setTimeout(() => node.classList.remove('is-scrolling'), 1000);
            }, { passive: true });
          }, [])}
        >
          <div
            ref={headerWrapperCallback}
            className={`${hasContent ? "sticky top-0 z-30 bg-gray-50" : ""}`}
          >
            <div
              ref={headerRef}
              className="max-w-4xl mx-auto px-4 py-3 space-y-3"
            />
          </div>
          <StickyOffsetContext.Provider value={stickyOffset}>
            <div className={`max-w-4xl mx-auto px-4 pt-2 ${showSaveBar ? "pb-20" : "pb-6"}`}>{children}</div>
          </StickyOffsetContext.Provider>
        </main>
      </div>
      <Toaster
        position="bottom-center"
        containerStyle={{ bottom: showSaveBar ? 64 : 16 }}
      />
      {showSaveBar && <SaveBar />}
      {showSetup && <SetupGuide onClose={() => setShowSetup(false)} />}
      {showEditName && <EditNameModal onClose={() => setShowEditName(false)} />}
    </PageHeaderPortalContext.Provider>
  );
}
