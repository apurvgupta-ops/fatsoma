export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

export type TabParamList = {
  ExploreTab: undefined;
  TicketsTab: undefined;
  ProfileTab: undefined;
};

export type InfoPageId = "how-it-works" | "trust-safety" | "pricing" | "help-centre" | "contact" | "terms";

export type RootStackParamList = {
  Main: undefined;
  EventDetail: { eventId: string };
  InfoPage: { pageId: InfoPageId; title: string };
};

export type MainStackParamList = {
  HomeTabs: undefined;
  EventDetail: { eventId: string };
  InfoPage: { pageId: InfoPageId; title: string };
};
