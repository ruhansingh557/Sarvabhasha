/**
 * Navigation param lists. Bottom tabs + one native stack per tab
 * (CLAUDE.md: "bottom tabs + per-tab native stacks"). Each stack currently
 * holds a single placeholder screen; real screens land in future work per
 * specs/home-and-dashboard.md, specs/learn-and-categories.md,
 * specs/ai-tutor.md, specs/profile-and-settings.md.
 */

export type MainTabParamList = {
  HomeTab: undefined;
  LearnTab: undefined;
  TutorTab: undefined;
  ProfileTab: undefined;
};

export type HomeStackParamList = {
  Home: undefined;
};

export type LearnStackParamList = {
  Learn: undefined;
};

export type TutorStackParamList = {
  Tutor: undefined;
};

export type ProfileStackParamList = {
  Profile: undefined;
};
