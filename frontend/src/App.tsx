import { lazy, Suspense, type ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { DemoProvider } from "./contexts/DemoContext";
import TopNav from "@/components/proofmode/TopNav";

const Home = lazy(() => import("@/pages/Home"));
const Orientation = lazy(() => import("@/pages/Orientation"));
const Assessment = lazy(() => import("@/pages/Assessment"));
const PatchReview = lazy(() => import("@/pages/PatchReview"));
const Results = lazy(() => import("@/pages/Results"));
const Reviewer = lazy(() => import("@/pages/Reviewer"));

function Screen({ children, withNav = true }: { children: ReactNode; withNav?: boolean }) {
  return <Suspense fallback={<div className="pm-route-loading" role="status">Loading ProofMode…</div>}>
    {withNav && <TopNav />}{children}
  </Suspense>;
}
function Router() {
  return <Switch>
    <Route path="/"><Screen><Home /></Screen></Route>
    <Route path="/orientation"><Screen><Orientation /></Screen></Route>
    <Route path="/assessment"><Screen withNav={false}><Assessment /></Screen></Route>
    <Route path="/assessment/review"><Screen><PatchReview /></Screen></Route>
    <Route path="/results"><Screen><Results /></Screen></Route>
    <Route path="/reviewer"><Screen><Reviewer /></Screen></Route>
    <Route path="/404" component={NotFound} />
    <Route><NotFound /></Route>
  </Switch>;
}
export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster /><DemoProvider><Router /></DemoProvider></TooltipProvider></ThemeProvider></ErrorBoundary>;
}
