import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:yapper/core/constants/app_constants.dart';
import 'package:yapper/core/router/app_router.dart';
import 'package:yapper/core/theme/app_theme.dart';

class YapperApp extends ConsumerWidget {
  const YapperApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(appRouterProvider);

    return MaterialApp.router(
      title: AppConstants.appName,
      debugShowCheckedModeBanner: false,
      theme: AppTheme.darkTheme,
      routerConfig: router,
    );
  }
}
