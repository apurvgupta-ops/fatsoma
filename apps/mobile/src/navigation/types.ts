import type { NavigatorScreenParams } from "@react-navigation/native";

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token: string };
};

export type TabParamList = {
  ExploreTab: undefined;
  TicketsTab: undefined;
  ProfileTab: undefined;
};

export type InfoPageId = "how-it-works" | "trust-safety" | "pricing" | "help-centre" | "contact" | "terms";

export type RootStackParamList = {
  Main: NavigatorScreenParams<TabParamList> | undefined;
  EventDetail: { eventId: string };
  InfoPage: { pageId: InfoPageId; title: string };
  CheckoutSuccess: { sessionId: string };
};

export type MainStackParamList = {
  HomeTabs: undefined;
  EventDetail: { eventId: string };
  InfoPage: { pageId: InfoPageId; title: string };
  CheckoutSuccess: { sessionId: string };
};
