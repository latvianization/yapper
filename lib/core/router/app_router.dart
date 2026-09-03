import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:yapper/features/chat/views/main_layout_screen.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/',
    routes: [
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
