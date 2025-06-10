// TypeScript declarations for modules without type definitions

declare module 'passport-google-oauth20' {
  import { Request } from 'express';
  import { Strategy as PassportStrategy } from 'passport';

  export interface Profile {
    id: string;
    displayName: string;
    name?: {
      familyName: string;
      givenName: string;
      middleName?: string;
    };
    emails?: Array<{
      value: string;
      type?: string;
    }>;
    photos?: Array<{
      value: string;
    }>;
    provider: string;
    _raw: string;
    _json: any;
  }

  export interface StrategyOptions {
    clientID: string;
    clientSecret: string;
    callbackURL: string;
    passReqToCallback?: false;
  }

  export interface StrategyOptionsWithRequest {
    clientID: string;
    clientSecret: string;
    callbackURL: string;
    passReqToCallback: true;
  }

  export type VerifyCallback = (
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (error: any, user?: any, info?: any) => void
  ) => void;

  export type VerifyFunctionWithRequest = (
    req: Request,
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (error: any, user?: any, info?: any) => void
  ) => void;

  export class Strategy extends PassportStrategy {
    constructor(
      options: StrategyOptions,
      verify: VerifyCallback
    );
    constructor(
      options: StrategyOptionsWithRequest,
      verify: VerifyFunctionWithRequest
    );
    name: string;
    authenticate(req: Request, options?: any): void;
  }
}

declare module 'passport-facebook' {
  import { Request } from 'express';
  import { Strategy as PassportStrategy } from 'passport';

  export interface Profile {
    id: string;
    displayName: string;
    name?: {
      familyName: string;
      givenName: string;
      middleName?: string;
    };
    emails?: Array<{
      value: string;
      type?: string;
    }>;
    photos?: Array<{
      value: string;
    }>;
    provider: string;
    _raw: string;
    _json: any;
  }

  export interface StrategyOptions {
    clientID: string;
    clientSecret: string;
    callbackURL: string;
    profileFields?: string[];
    passReqToCallback?: false;
  }

  export interface StrategyOptionsWithRequest {
    clientID: string;
    clientSecret: string;
    callbackURL: string;
    profileFields?: string[];
    passReqToCallback: true;
  }

  export type VerifyCallback = (
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (error: any, user?: any, info?: any) => void
  ) => void;

  export type VerifyFunctionWithRequest = (
    req: Request,
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (error: any, user?: any, info?: any) => void
  ) => void;

  export class Strategy extends PassportStrategy {
    constructor(
      options: StrategyOptions,
      verify: VerifyCallback
    );
    constructor(
      options: StrategyOptionsWithRequest,
      verify: VerifyFunctionWithRequest
    );
    name: string;
    authenticate(req: Request, options?: any): void;
  }
}

declare module 'passport-github2' {
  import { Request } from 'express';
  import { Strategy as PassportStrategy } from 'passport';

  export interface Profile {
    id: string;
    displayName: string;
    username?: string;
    profileUrl?: string;
    emails?: Array<{
      value: string;
      primary?: boolean;
      verified?: boolean;
    }>;
    photos?: Array<{
      value: string;
    }>;
    provider: string;
    _raw: string;
    _json: any;
  }

  export interface StrategyOptions {
    clientID: string;
    clientSecret: string;
    callbackURL: string;
    scope?: string[];
    passReqToCallback?: false;
  }

  export interface StrategyOptionsWithRequest {
    clientID: string;
    clientSecret: string;
    callbackURL: string;
    scope?: string[];
    passReqToCallback: true;
  }

  export type VerifyCallback = (
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (error: any, user?: any, info?: any) => void
  ) => void;

  export type VerifyFunctionWithRequest = (
    req: Request,
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (error: any, user?: any, info?: any) => void
  ) => void;

  export class Strategy extends PassportStrategy {
    constructor(
      options: StrategyOptions,
      verify: VerifyCallback
    );
    constructor(
      options: StrategyOptionsWithRequest,
      verify: VerifyFunctionWithRequest
    );
    name: string;
    authenticate(req: Request, options?: any): void;
  }
}