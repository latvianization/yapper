import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:yapper/core/constants/app_constants.dart';
import 'package:yapper/features/auth/models/company_model.dart';
import 'package:yapper/features/auth/models/user_model.dart';

class AuthState {
  final UserModel? user;
  final List<CompanyModel> companies;
  final List<UserModel> registeredUsers;
  final bool isLoading;
  final String? error;

  const AuthState({
    this.user,
    this.companies = const [],
    this.registeredUsers = const [],
    this.isLoading = false,
    this.error,
  });

  bool get isAuthenticated => user != null;

  AuthState copyWith({
    UserModel? user,
    List<CompanyModel>? companies,
    List<UserModel>? registeredUsers,
    bool? isLoading,
    String? error,
    bool clearUser = false,
  }) {
    return AuthState(
      user: clearUser ? null : (user ?? this.user),
      companies: companies ?? this.companies,
      registeredUsers: registeredUsers ?? this.registeredUsers,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  static const String _keyUser = 'yapper_active_user';
  static const String _keyCompanies = 'yapper_companies_store';
  static const String _keyRegisteredUsers = 'yapper_registered_users_store';
  static const String _keyPasswords = 'yapper_passwords_store';

  AuthNotifier() : super(const AuthState(isLoading: true)) {
    _initAuthStore();
  }

  Future<void> _initAuthStore() async {
    try {
      final prefs = await SharedPreferences.getInstance();

      // 1. Load or seed Companies
      List<CompanyModel> loadedCompanies = [];
      final companiesJson = prefs.getString(_keyCompanies);
      if (companiesJson != null) {
        final list = jsonDecode(companiesJson) as List<dynamic>;
        loadedCompanies = list.map((e) => CompanyModel.fromJson(e as Map<String, dynamic>)).toList();
      } else {
        loadedCompanies = [
          CompanyModel(
            id: 'comp_acme',
            name: 'Acme Technologies',
            ownerId: 'user_alex',
            createdAt: DateTime.now().subtract(const Duration(days: 30)),
          ),
          CompanyModel(
            id: 'comp_stark',
            name: 'Stark Industries',
            ownerId: 'user_tony',
            createdAt: DateTime.now().subtract(const Duration(days: 15)),
          ),
        ];
        await prefs.setString(_keyCompanies, jsonEncode(loadedCompanies.map((c) => c.toJson()).toList()));
      }

      // 2. Load or seed Registered Users
      List<UserModel> loadedUsers = [];
      final usersJson = prefs.getString(_keyRegisteredUsers);
      if (usersJson != null) {
        final list = jsonDecode(usersJson) as List<dynamic>;
        loadedUsers = list.map((e) => UserModel.fromJson(e as Map<String, dynamic>)).toList();
      } else {
        loadedUsers = [
          // Acme Corp (Owner + Member)
          const UserModel(
            uid: 'user_alex',
            email: 'alex@acme.com',
            displayName: 'Alex Rivera (Owner)',
            role: AppConstants.roleOwner,
            companyId: 'comp_acme',
            companyName: 'Acme Technologies',
          ),
          const UserModel(
            uid: 'user_bob',
            email: 'bob@acme.com',
            displayName: 'Bob Martinez (Member)',
            role: AppConstants.roleMember,
            companyId: 'comp_acme',
            companyName: 'Acme Technologies',
          ),
          // Stark Industries (Other Company Owner)
          const UserModel(
            uid: 'user_tony',
            email: 'tony@stark.com',
            displayName: 'Tony Stark (Owner)',
            role: AppConstants.roleOwner,
            companyId: 'comp_stark',
            companyName: 'Stark Industries',
          ),
          const UserModel(
            uid: 'user_peter',
            email: 'peter@stark.com',
            displayName: 'Peter Parker (Member)',
            role: AppConstants.roleMember,
            companyId: 'comp_stark',
            companyName: 'Stark Industries',
          ),
        ];
        await prefs.setString(_keyRegisteredUsers, jsonEncode(loadedUsers.map((u) => u.toJson()).toList()));

        // Default passwords for seeded users (password: 'password123')
        final defaultPasswords = {
          'alex@acme.com': 'password123',
          'bob@acme.com': 'password123',
          'tony@stark.com': 'password123',
          'peter@stark.com': 'password123',
        };
        await prefs.setString(_keyPasswords, jsonEncode(defaultPasswords));
      }

      // 3. Load active session
      UserModel? activeUser;
      final userJson = prefs.getString(_keyUser);
      if (userJson != null) {
        final map = jsonDecode(userJson);
        activeUser = UserModel.fromJson(map);
      }

      state = AuthState(
        user: activeUser,
        companies: loadedCompanies,
        registeredUsers: loadedUsers,
        isLoading: false,
      );
    } catch (e) {
      state = AuthState(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  Future<bool> login(String email, String password) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final normalizedEmail = email.trim().toLowerCase();
      final prefs = await SharedPreferences.getInstance();

      final passwordsJson = prefs.getString(_keyPasswords);
      final passwords = passwordsJson != null ? Map<String, dynamic>.from(jsonDecode(passwordsJson)) : {};

      // Match user
      final user = state.registeredUsers.cast<UserModel?>().firstWhere(
        (u) => u?.email.trim().toLowerCase() == normalizedEmail,
        orElse: () => null,
      );

      if (user == null) {
        state = state.copyWith(isLoading: false, error: 'Account not found. Please register first.');
        return false;
      }

      final storedPassword = passwords[normalizedEmail] as String?;
      if (storedPassword != null && storedPassword != password) {
        state = state.copyWith(isLoading: false, error: 'Incorrect password.');
        return false;
      }

      await prefs.setString(_keyUser, jsonEncode(user.toJson()));
      state = state.copyWith(user: user, isLoading: false, error: null);
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      return false;
    }
  }

  Future<bool> register({
    required String email,
    required String password,
    required String displayName,
    String? companyName,
    String? existingCompanyId,
  }) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final normalizedEmail = email.trim().toLowerCase();
      if (state.registeredUsers.any((u) => u.email.trim().toLowerCase() == normalizedEmail)) {
        state = state.copyWith(isLoading: false, error: 'Email already registered. Please log in.');
        return false;
      }

      final prefs = await SharedPreferences.getInstance();
      final newUid = 'usr_${DateTime.now().millisecondsSinceEpoch}';

      CompanyModel targetCompany;
      String userRole;

      if (companyName != null && companyName.trim().isNotEmpty) {
        // Registering as creator/owner of a new workspace
        final compId = 'comp_${DateTime.now().millisecondsSinceEpoch}';
        targetCompany = CompanyModel(
          id: compId,
          name: companyName.trim(),
          ownerId: newUid,
          createdAt: DateTime.now(),
        );
        userRole = AppConstants.roleOwner;

        final updatedCompanies = [...state.companies, targetCompany];
        await prefs.setString(_keyCompanies, jsonEncode(updatedCompanies.map((c) => c.toJson()).toList()));
        state = state.copyWith(companies: updatedCompanies);
      } else if (existingCompanyId != null && existingCompanyId.isNotEmpty) {
        // Joining existing company as member
        final found = state.companies.cast<CompanyModel?>().firstWhere(
          (c) => c?.id == existingCompanyId,
          orElse: () => null,
        );
        if (found == null) {
          state = state.copyWith(isLoading: false, error: 'Workspace ID not found.');
          return false;
        }
        targetCompany = found;
        userRole = AppConstants.roleMember;
      } else {
        state = state.copyWith(isLoading: false, error: 'Please enter a workspace name or select one to join.');
        return false;
      }

      final newUser = UserModel(
        uid: newUid,
        email: normalizedEmail,
        displayName: displayName.trim(),
        role: userRole,
        companyId: targetCompany.id,
        companyName: targetCompany.name,
      );

      // Save user
      final updatedUsers = [...state.registeredUsers, newUser];
      await prefs.setString(_keyRegisteredUsers, jsonEncode(updatedUsers.map((u) => u.toJson()).toList()));

      // Save password
      final passwordsJson = prefs.getString(_keyPasswords);
      final passwords = passwordsJson != null ? Map<String, dynamic>.from(jsonDecode(passwordsJson)) : {};
      passwords[normalizedEmail] = password;
      await prefs.setString(_keyPasswords, jsonEncode(passwords));

      // Save active session
      await prefs.setString(_keyUser, jsonEncode(newUser.toJson()));

      state = state.copyWith(
        user: newUser,
        registeredUsers: updatedUsers,
        isLoading: false,
        error: null,
      );
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      return false;
    }
  }

  Future<void> switchUser(UserModel user) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyUser, jsonEncode(user.toJson()));
    state = state.copyWith(user: user, error: null);
  }

  Future<void> updateStatus(String newStatus) async {
    if (state.user == null) return;
    final updated = state.user!.copyWith(status: newStatus);
    state = state.copyWith(user: updated);

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyUser, jsonEncode(updated.toJson()));
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_keyUser);
    state = state.copyWith(clearUser: true, error: null);
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier();
});
