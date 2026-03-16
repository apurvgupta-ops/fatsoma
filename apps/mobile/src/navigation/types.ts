export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

export type RootStackParamList = {
  Explore: undefined;
  EventDetail: { eventId: string };
};

export type TabParamList = {
  ExploreTab: undefined;
  TicketsTab: undefined;
  ProfileTab: undefined;
};
