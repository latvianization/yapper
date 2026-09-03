import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:yapper/core/theme/app_theme.dart';
import 'package:yapper/features/auth/providers/auth_provider.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _companyNameController = TextEditingController();
  String? _selectedCompanyId;
  bool _createNewCompany = true;
  bool _obscurePassword = true;

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _companyNameController.dispose();
    super.dispose();
  }

  Future<void> _handleRegister() async {
    if (!_formKey.currentState!.validate()) return;

    final success = await ref.read(authProvider.notifier).register(
      displayName: _nameController.text,
      email: _emailController.text,
      password: _passwordController.text,
      companyName: _createNewCompany ? _companyNameController.text : null,
      existingCompanyId: !_createNewCompany ? _selectedCompanyId : null,
    );

    if (success && mounted) {
      context.go('/');
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);

    return Scaffold(
      backgroundColor: AppColors.bgMain,
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 480),
            child: Container(
              padding: const EdgeInsets.all(32),
              decoration: BoxDecoration(
                color: AppColors.bgSurface1,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.borderColor),
                boxShadow: const [
                  BoxShadow(
                    color: Colors.black26,
                    blurRadius: 24,
                    offset: Offset(0, 8),
                  ),
                ],
              ),
              child: Form(
                key: _formKey,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Brand
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          width: 36,
                          height: 36,
                          alignment: Alignment.center,
                          decoration: BoxDecoration(
                            color: AppColors.primary,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: const Text('⚡', style: TextStyle(fontSize: 20)),
                        ),
                        const SizedBox(width: 10),
                        const Text(
                          'Yapper',
                          style: TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.w800,
                            color: AppColors.textMain,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    const Text(
                      'Create Your Account',
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.textMain),
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'Set up your company workspace or join an existing team',
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 13, color: AppColors.textMuted),
                    ),
                    const SizedBox(height: 20),

                    // Error Banner
                    if (authState.error != null) ...[
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                        decoration: BoxDecoration(
                          color: AppColors.danger.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: AppColors.danger.withValues(alpha: 0.4)),
                        ),
                        child: Row(
                          children: [
                            const Icon(LucideIcons.alertCircle, size: 16, color: AppColors.danger),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Text(
                                authState.error!,
                                style: const TextStyle(color: AppColors.danger, fontSize: 13),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),
                    ],

                    // Full Name
                    const Text('Full Name', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textDim)),
                    const SizedBox(height: 6),
                    TextFormField(
                      controller: _nameController,
                      style: const TextStyle(color: AppColors.textMain),
                      decoration: const InputDecoration(
                        hintText: 'e.g. Bruce Wayne',
                        prefixIcon: Icon(LucideIcons.user, size: 18, color: AppColors.textDim),
                      ),
                      validator: (val) => (val == null || val.trim().isEmpty) ? 'Full Name is required' : null,
                    ),
                    const SizedBox(height: 14),

                    // Email Address
                    const Text('Work Email', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textDim)),
                    const SizedBox(height: 6),
                    TextFormField(
                      controller: _emailController,
                      keyboardType: TextInputType.emailAddress,
                      style: const TextStyle(color: AppColors.textMain),
                      decoration: const InputDecoration(
                        hintText: 'bruce@wayne-enterprises.com',
                        prefixIcon: Icon(LucideIcons.mail, size: 18, color: AppColors.textDim),
                      ),
                      validator: (val) {
                        if (val == null || val.trim().isEmpty) return 'Email is required';
                        if (!val.contains('@')) return 'Enter a valid email address';
                        return null;
                      },
                    ),
                    const SizedBox(height: 14),

                    // Password
                    const Text('Password', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textDim)),
                    const SizedBox(height: 6),
                    TextFormField(
                      controller: _passwordController,
                      obscureText: _obscurePassword,
                      style: const TextStyle(color: AppColors.textMain),
                      decoration: InputDecoration(
                        hintText: '••••••••',
                        prefixIcon: const Icon(LucideIcons.lock, size: 18, color: AppColors.textDim),
                        suffixIcon: IconButton(
                          icon: Icon(
                            _obscurePassword ? LucideIcons.eyeOff : LucideIcons.eye,
                            size: 18,
                            color: AppColors.textDim,
                          ),
                          onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                        ),
                      ),
                      validator: (val) => (val == null || val.length < 4) ? 'Password must be at least 4 characters' : null,
                    ),
                    const SizedBox(height: 20),

                    // Workspace Type Toggle
                    Container(
                      padding: const EdgeInsets.all(4),
                      decoration: BoxDecoration(
                        color: AppColors.bgSurface2,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: InkWell(
                              borderRadius: BorderRadius.circular(8),
                              onTap: () => setState(() => _createNewCompany = true),
                              child: Container(
                                padding: const EdgeInsets.symmetric(vertical: 8),
                                alignment: Alignment.center,
                                decoration: BoxDecoration(
                                  color: _createNewCompany ? AppColors.primary : Colors.transparent,
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(
                                  '👑 Create Company (Owner)',
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: _createNewCompany ? FontWeight.bold : FontWeight.normal,
                                    color: _createNewCompany ? Colors.white : AppColors.textMuted,
                                  ),
                                ),
                              ),
                            ),
                          ),
                          Expanded(
                            child: InkWell(
                              borderRadius: BorderRadius.circular(8),
                              onTap: () => setState(() {
                                _createNewCompany = false;
                                if (_selectedCompanyId == null && authState.companies.isNotEmpty) {
                                  _selectedCompanyId = authState.companies.first.id;
                                }
                              }),
                              child: Container(
                                padding: const EdgeInsets.symmetric(vertical: 8),
                                alignment: Alignment.center,
                                decoration: BoxDecoration(
                                  color: !_createNewCompany ? AppColors.primary : Colors.transparent,
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(
                                  '👥 Join Team (Member)',
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: !_createNewCompany ? FontWeight.bold : FontWeight.normal,
                                    color: !_createNewCompany ? Colors.white : AppColors.textMuted,
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Company Name input OR Company Selector
                    if (_createNewCompany) ...[
                      const Text('Company / Workspace Name', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textDim)),
                      const SizedBox(height: 6),
                      TextFormField(
                        controller: _companyNameController,
                        style: const TextStyle(color: AppColors.textMain),
                        decoration: const InputDecoration(
                          hintText: 'e.g. Wayne Enterprises',
                          prefixIcon: Icon(LucideIcons.building, size: 18, color: AppColors.textDim),
                        ),
                        validator: (val) {
                          if (_createNewCompany && (val == null || val.trim().isEmpty)) {
                            return 'Workspace name is required';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 6),
                      const Text(
                        'You will be designated as the Workspace Owner with full access to all channels.',
                        style: TextStyle(fontSize: 11, color: AppColors.accent),
                      ),
                    ] else ...[
                      const Text('Select Workspace to Join', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textDim)),
                      const SizedBox(height: 6),
                      DropdownButtonFormField<String>(
                        initialValue: _selectedCompanyId ?? (authState.companies.isNotEmpty ? authState.companies.first.id : null),
                        dropdownColor: AppColors.bgSurface1,
                        style: const TextStyle(color: AppColors.textMain),
                        decoration: const InputDecoration(
                          prefixIcon: Icon(LucideIcons.users, size: 18, color: AppColors.textDim),
                        ),
                        items: authState.companies.map((c) {
                          return DropdownMenuItem(
                            value: c.id,
                            child: Text(c.name, style: const TextStyle(color: AppColors.textMain)),
                          );
                        }).toList(),
                        onChanged: (val) => setState(() => _selectedCompanyId = val),
                        validator: (val) => val == null ? 'Please select a company' : null,
                      ),
                      const SizedBox(height: 6),
                      const Text(
                        'You will join as a Member. You will only see public channels and private channels you are assigned to.',
                        style: TextStyle(fontSize: 11, color: AppColors.textDim),
                      ),
                    ],
                    const SizedBox(height: 24),

                    // Register Button
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      onPressed: authState.isLoading ? null : _handleRegister,
                      child: authState.isLoading
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                            )
                          : const Text('Create Account & Enter Workspace', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                    ),
                    const SizedBox(height: 16),

                    // Login Link
                    Wrap(
                      alignment: WrapAlignment.center,
                      crossAxisAlignment: WrapCrossAlignment.center,
                      children: [
                        const Text('Already have an account? ', style: TextStyle(fontSize: 13, color: AppColors.textMuted)),
                        GestureDetector(
                          onTap: () => context.go('/login'),
                          child: const Text(
                            'Sign In',
                            style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.primary),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
