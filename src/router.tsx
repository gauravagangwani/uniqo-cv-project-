import { useEffect, useState } from "react";
import Landing from "./pages/Landing";
import DrawApp from "./pages/DrawApp";
import MagicApp from "./pages/MagicApp";

export type Route = "/" | "/draw" | "/magic";

function getRoute(): Route {
  const hash = window.location.hash.replace(/^#/, "");
  if (hash === "/draw") return "/draw";
  if (hash === "/magic") return "/magic";
  return "/";
}

export function navigate(route: Route) {
  window.location.hash = route;
}

export function Router() {
  const [route, setRoute] = useState<Route>(getRoute());
  const [fade, setFade] = useState(false);

  useEffect(() => {
    const onHash = () => {
      setFade(true);
      window.setTimeout(() => {
        setRoute(getRoute());
        setFade(false);
      }, 200);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  let page: JSX.Element;
  if (route === "/draw") page = <DrawApp />;
  else if (route === "/magic") page = <MagicApp />;
  else page = <Landing />;

  return (
    <div
      style={{
        opacity: fade ? 0 : 1,
        transition: "opacity 200ms ease",
        minHeight: "100vh",
      }}
    >
      {page}
    </div>
  );
}
