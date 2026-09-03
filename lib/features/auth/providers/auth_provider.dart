import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:yapper/core/constants/app_constants.dart';
import 'package:yapper/features/auth/models/user_model.dart';

class AuthState {
  final UserModel? user;
  final bool isLoading;
  final String? error;

  const AuthState({
    this.user,
    this.isLoading = false,
    this.error,
  });

  bool get isAuthenticated => user != null;

  AuthState copyWith({
    UserModel? user,
    bool? isLoading,
    String? error,
  }) {
    return AuthState(
      user: user ?? this.user,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  AuthNotifier() : super(const AuthState(isLoading: true)) {
    _loadUser();
  }

  Future<void> _loadUser() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final userJson = prefs.getString(AppConstants.keyUser);
      if (userJson != null) {
        final map = jsonDecode(userJson);
        state = AuthState(user: UserModel.fromJson(map), isLoading: false);
        return;
      }
    } catch (_) {}

    // Default demo mock user matching Yapper's initial experience
    const defaultUser = UserModel(
      uid: 'user_alex',
      email: 'alex.rivera@yapper.corp',
      displayName: 'Alex Rivera',
      status: 'online',
      role: AppConstants.roleOwner,
    );
    state = const AuthState(user: defaultUser, isLoading: false);
  }

  Future<void> login(String email, String displayName) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final user = UserModel(
        uid: 'usr_${DateTime.now().millisecondsSinceEpoch}',
        email: email,
        displayName: displayName,
        status: 'online',
        role: AppConstants.roleMember,
      );

      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(AppConstants.keyUser, jsonEncode(user.toJson()));

      state = AuthState(user: user, isLoading: false);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<void> updateStatus(String newStatus) async {
    if (state.user == null) return;
    final updated = state.user!.copyWith(status: newStatus);
    state = state.copyWith(user: updated);

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(AppConstants.keyUser, jsonEncode(updated.toJson()));
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(AppConstants.keyUser);
    state = const AuthState(user: null);
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier();
});
