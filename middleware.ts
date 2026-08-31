import { withAuth } from 'next-auth/middleware';

export default withAuth({
  pages: {
    signIn: '/login',
  },
});

export const config = {
  matcher: ['/dashboard/:path*'],
};

//This automatically redirects unauthenticated users to /login
//when they try to access /dashboard or any subroute.
