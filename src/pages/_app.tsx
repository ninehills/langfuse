import { type AppType } from "next/app";
import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { setUser } from "@sentry/nextjs";
import { useSession } from "next-auth/react";

import { api } from "@/src/utils/api";

import NextAdapterPages from "next-query-params/pages";
import { QueryParamProvider } from "use-query-params";

import "@/src/styles/globals.css";
import Layout from "@/src/components/layouts/layout";
import { useEffect } from "react";
import { useRouter } from "next/router";

import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { CrispWidget, chatSetUser } from "@/src/features/support-chat";

const setProjectInPosthog = () => {
  // project
  const url = window.location.href;
  const regex = /\/project\/([^\/]+)/;
  const match = url.match(regex);
  if (match && match[1]) {
    posthog?.group("project", match[1]);
  } else {
    posthog?.resetGroups();
  }
};

// Check that PostHog is client-side (used to handle Next.js SSR) and that env vars are set
if (
  typeof window !== "undefined" &&
  process.env.NEXT_PUBLIC_POSTHOG_KEY &&
  process.env.NEXT_PUBLIC_POSTHOG_HOST
) {
  setProjectInPosthog();
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.posthog.com",
    // Enable debug mode in development
    loaded: (posthog) => {
      if (process.env.NODE_ENV === "development") posthog.debug();
    },
  });
}

const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  const router = useRouter();

  useEffect(() => {
    // PostHog (cloud.langfuse.com)
    if (
      process.env.NEXT_PUBLIC_POSTHOG_KEY &&
      process.env.NEXT_PUBLIC_POSTHOG_HOST
    ) {
      const handleRouteChange = () => {
        setProjectInPosthog();
        posthog?.capture("$pageview");
      };
      router.events.on("routeChangeComplete", handleRouteChange);

      return () => {
        router.events.off("routeChangeComplete", handleRouteChange);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <QueryParamProvider adapter={NextAdapterPages}>
      <PostHogProvider client={posthog}>
        <SessionProvider session={session} refetchOnWindowFocus={true}>
          <Layout>
            <Component {...pageProps} />
            <UserTracking />
          </Layout>
          <CrispWidget />
        </SessionProvider>
      </PostHogProvider>
    </QueryParamProvider>
  );
};

export default api.withTRPC(MyApp);

function UserTracking() {
  const session = useSession();

  useEffect(() => {
    if (session.status === "authenticated" && session.data) {
      // PostHog
      if (
        process.env.NEXT_PUBLIC_POSTHOG_KEY &&
        process.env.NEXT_PUBLIC_POSTHOG_HOST
      )
        posthog.identify(session.data.user?.id ?? undefined, {
          email: session.data.user?.email ?? undefined,
          name: session.data.user?.name ?? undefined,
          featureFlags: session.data.user?.featureFlags ?? undefined,
          projects: session.data.user?.projects ?? undefined,
          LANGFUSE_CLOUD_REGION: process.env.NEXT_PUBLIC_LANGFUSE_CLOUD_REGION,
        });
      const emailDomain = session.data.user?.email?.split("@")[1];
      if (emailDomain)
        posthog.group("emailDomain", emailDomain, {
          domain: emailDomain,
        });

      // Sentry
      setUser({
        email: session.data.user?.email ?? undefined,
        id: session.data.user?.id ?? undefined,
      });
      // Chat
      chatSetUser({
        name: session.data.user?.name ?? "undefined",
        email: session.data.user?.email ?? "undefined",
        data: {
          userId: session.data.user?.id ?? "undefined",
          projects: JSON.stringify(session.data.user?.projects) ?? "undefined",
          featureFlags:
            JSON.stringify(session.data.user?.featureFlags) ?? "undefined",
        },
      });
    } else {
      // PostHog
      if (
        process.env.NEXT_PUBLIC_POSTHOG_KEY &&
        process.env.NEXT_PUBLIC_POSTHOG_HOST
      ) {
        posthog.reset();
        posthog.resetGroups();
      }
      // Sentry
      setUser(null);
    }
  }, [session]);
  return null;
}
