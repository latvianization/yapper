import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:yapper/features/auth/providers/auth_provider.dart';
import 'package:yapper/features/auth/views/login_screen.dart';
import 'package:yapper/features/auth/views/register_screen.dart';
import 'package:yapper/features/chat/views/main_layout_screen.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authProvider);

  return GoRouter(
    initialLocation: '/',
    redirect: (context, state) {
      if (authState.isLoading) return null;

      final isLoggingIn = state.matchedLocation == '/login';
      final isRegistering = state.matchedLocation == '/register';

      if (!authState.isAuthenticated) {
        if (isLoggingIn || isRegistering) return null;
        return '/login';
      }

      if (isLoggingIn || isRegistering) {
        return '/';
      }

      return null;
    },
    routes: [
      GoRoute(
        path: '/login',
        name: 'login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/register',
        name: 'register',
        builder: (context, state) => const RegisterScreen(),
      ),
      GoRoute(
        path: '/',
        name: 'home',
        builder: (context, state) => const MainLayoutScreen(),
      ),
      GoRoute(
        path: '/channels/:id',
        name: 'channel',
        builder: (context, state) => const MainLayoutScreen(),
      ),
    ],
  );
});
