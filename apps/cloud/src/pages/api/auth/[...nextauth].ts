import { prisma } from '@backend/prisma';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import NextAuth, { NextAuthOptions } from 'next-auth';
import { Provider } from 'next-auth/providers';
import DiscordProvider from 'next-auth/providers/discord';
import GithubProvider from 'next-auth/providers/github';
import GitlabProvider from 'next-auth/providers/gitlab';

const getProviders = () => {
  const providers: Provider[] = [];

  if (process.env.GITHUB_ID && process.env.GITHUB_SECRET) {
    providers.push(
      GithubProvider({
        clientId: process.env.GITHUB_ID,
        clientSecret: process.env.GITHUB_SECRET,
      })
    );
  }

  if (process.env.GITLAB_ID && process.env.GITLAB_SECRET) {
    providers.push(
      GitlabProvider({
        clientId: process.env.GITLAB_ID,
        clientSecret: process.env.GITLAB_SECRET,
      })
    );
  }

  if (process.env.DISCORD_ID && process.env.DISCORD_SECRET) {
    providers.push(
      DiscordProvider({
        clientId: process.env.DISCORD_ID,
        clientSecret: process.env.DISCORD_SECRET,
      })
    );
  }

  return providers;
};

export const authOptions: NextAuthOptions = {
  providers: getProviders(),
  pages: {
    signIn: '/user/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: 'something',
  adapter: PrismaAdapter(prisma),
  callbacks: {
    session: async ({ session, token }) => {
      if (session?.user) {
        // @ts-ignore
        session.user.id = token.uid;
      }

      return session;
    },
    jwt: async ({ user, token }) => {
      if (user) {
        token.uid = user.id;
      }

      return token;
    },
  },
};

export default NextAuth(authOptions);
