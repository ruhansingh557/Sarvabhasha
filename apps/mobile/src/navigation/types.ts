/**
 * Navigation param lists. Bottom tabs + one native stack per tab
 * (CLAUDE.md: "bottom tabs + per-tab native stacks").
 *
 * `MainTabParamList`'s tab entries carry their stack's params via
 * `NavigatorScreenParams` so a cross-tab `navigation.navigate('LearnTab', {
 * screen: 'PhraseList', params: { categorySlug } })` (used by Home's
 * "continue learning" CTA) type-checks against the real nested route.
 */

import type { NavigatorScreenParams } from '@react-navigation/native';
import type { Id } from '@backend/_generated/dataModel';

export type MainTabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  LearnTab: NavigatorScreenParams<LearnStackParamList>;
  TutorTab: NavigatorScreenParams<TutorStackParamList>;
  ProfileTab: NavigatorScreenParams<ProfileStackParamList>;
};

export type HomeStackParamList = {
  Home: undefined;
};

export type LearnStackParamList = {
  Learn: undefined;
  /** The "Common Phrases" destination — the former Learn-tab root, unchanged behavior. */
  PhraseCategories: undefined;
  PhraseList: { categorySlug: string };
  PhraseDetail: { phraseId: Id<'phrases'> };
  Aksharmala: undefined;
  Numbers: undefined;
  Vocabulary: undefined;
};

export type TutorStackParamList = {
  Tutor: undefined;
};

export type ProfileStackParamList = {
  Profile: undefined;
};
