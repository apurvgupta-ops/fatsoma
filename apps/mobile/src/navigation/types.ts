export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

export type TabParamList = {
  ExploreTab: undefined;
  TicketsTab: undefined;
  ProfileTab: undefined;
};

export type RootStackParamList = {
  Main: undefined;
  EventDetail: { eventId: string };
};

export type MainStackParamList = {
  HomeTabs: undefined;
  EventDetail: { eventId: string };
};
