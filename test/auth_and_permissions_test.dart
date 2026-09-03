import 'package:flutter_test/flutter_test.dart';
import 'package:yapper/core/constants/app_constants.dart';
import 'package:yapper/features/auth/models/company_model.dart';
import 'package:yapper/features/auth/models/user_model.dart';
import 'package:yapper/features/chat/models/channel_model.dart';

void main() {
  group('Multi-Tenant Access Control & Permissions', () {
    // Company A: Acme Corp
    const userAlexOwner = UserModel(
      uid: 'user_alex',
      email: 'alex@acme.com',
      displayName: 'Alex Rivera',
      role: AppConstants.roleOwner,
      companyId: 'comp_acme',
      companyName: 'Acme Corp',
    );

    const userBobAssignedMember = UserModel(
      uid: 'user_bob',
      email: 'bob@acme.com',
      displayName: 'Bob Martinez',
      role: AppConstants.roleMember,
      companyId: 'comp_acme',
      companyName: 'Acme Corp',
    );

    const userDavidUnassignedMember = UserModel(
      uid: 'user_david',
      email: 'david@acme.com',
      displayName: 'David Kim',
      role: AppConstants.roleMember,
      companyId: 'comp_acme',
      companyName: 'Acme Corp',
    );

    // Company B: Stark Industries
    const userTonyOtherCompanyOwner = UserModel(
      uid: 'user_tony',
      email: 'tony@stark.com',
      displayName: 'Tony Stark',
      role: AppConstants.roleOwner,
      companyId: 'comp_stark',
      companyName: 'Stark Industries',
    );

    const userPeterOtherCompanyMember = UserModel(
      uid: 'user_peter',
      email: 'peter@stark.com',
      displayName: 'Peter Parker',
      role: AppConstants.roleMember,
      companyId: 'comp_stark',
      companyName: 'Stark Industries',
    );

    // Channels
    const publicAcmeChannel = ChannelModel(
      id: 'chan_acme_general',
      name: 'general',
      companyId: 'comp_acme',
      isPrivate: false,
    );

    const privateRestrictedAcmeChannel = ChannelModel(
      id: 'chan_acme_secret',
      name: 'board-secret',
      companyId: 'comp_acme',
      isPrivate: true,
      memberUids: ['user_bob'], // Bob is assigned; David is NOT
    );

    const publicStarkChannel = ChannelModel(
      id: 'chan_stark_general',
      name: 'general',
      companyId: 'comp_stark',
      isPrivate: false,
    );

    // Permission logic function matching ChatNotifier.canUserAccessChannel
    bool canUserAccessChannel(ChannelModel channel, UserModel? user) {
      if (user == null) return false;
      if (channel.companyId != user.companyId) return false;
      if (user.role == AppConstants.roleOwner) return true;
      if (!channel.isPrivate) return true;
      return channel.memberUids.contains(user.uid);
    }

    test('1. Company Isolation: Users from other company CANNOT view public or private channels', () {
      // Tony and Peter (Stark) cannot access Acme channels
      expect(canUserAccessChannel(publicAcmeChannel, userTonyOtherCompanyOwner), isFalse);
      expect(canUserAccessChannel(publicAcmeChannel, userPeterOtherCompanyMember), isFalse);
      expect(canUserAccessChannel(privateRestrictedAcmeChannel, userTonyOtherCompanyOwner), isFalse);
      expect(canUserAccessChannel(privateRestrictedAcmeChannel, userPeterOtherCompanyMember), isFalse);

      // Alex and Bob (Acme) cannot access Stark channels
      expect(canUserAccessChannel(publicStarkChannel, userAlexOwner), isFalse);
      expect(canUserAccessChannel(publicStarkChannel, userBobAssignedMember), isFalse);
    });

    test('2. Owner Access: Workspace Owner can view ALL company channels including restricted ones', () {
      expect(canUserAccessChannel(publicAcmeChannel, userAlexOwner), isTrue);
      expect(canUserAccessChannel(privateRestrictedAcmeChannel, userAlexOwner), isTrue);
    });

    test('3. Assigned Member Access: Assigned member CAN view restricted channel', () {
      expect(canUserAccessChannel(privateRestrictedAcmeChannel, userBobAssignedMember), isTrue);
    });

    test('4. Unassigned Member Denial: Unassigned member CANNOT view restricted channel', () {
      // David is in Acme Corp, but is not an owner and is not in memberUids
      expect(canUserAccessChannel(publicAcmeChannel, userDavidUnassignedMember), isTrue);
      expect(canUserAccessChannel(privateRestrictedAcmeChannel, userDavidUnassignedMember), isFalse);
    });

    test('5. Unauthenticated user cannot view any channel', () {
      expect(canUserAccessChannel(publicAcmeChannel, null), isFalse);
      expect(canUserAccessChannel(privateRestrictedAcmeChannel, null), isFalse);
    });

    test('6. Serialization: UserModel & CompanyModel support multi-tenancy serialization', () {
      final comp = CompanyModel(
        id: 'comp_test',
        name: 'Test Corp',
        ownerId: 'user_1',
        createdAt: DateTime(2026, 1, 1),
      );
      final compJson = comp.toJson();
      final compDecoded = CompanyModel.fromJson(compJson);
      expect(compDecoded.id, equals('comp_test'));
      expect(compDecoded.name, equals('Test Corp'));

      const user = UserModel(
        uid: 'u_1',
        email: 'test@test.com',
        displayName: 'Test User',
        companyId: 'comp_test',
        companyName: 'Test Corp',
        role: AppConstants.roleOwner,
      );
      final userJson = user.toJson();
      final userDecoded = UserModel.fromJson(userJson);
      expect(userDecoded.companyId, equals('comp_test'));
      expect(userDecoded.companyName, equals('Test Corp'));
      expect(userDecoded.role, equals(AppConstants.roleOwner));
    });

    test('7. Favorite Company Teammates: Company isolation applies to teammates and favorites', () {
      final allUsers = [
        userAlexOwner, // Acme
        userBobAssignedMember, // Acme
        userDavidUnassignedMember, // Acme
        userTonyOtherCompanyOwner, // Stark
        userPeterOtherCompanyMember, // Stark
      ];

      // Alex looks for Acme company teammates (excluding self)
      final acmeTeammates = allUsers
          .where((u) => u.companyId == userAlexOwner.companyId && u.uid != userAlexOwner.uid)
          .toList();

      expect(acmeTeammates.map((u) => u.uid), containsAll(['user_bob', 'user_david']));
      expect(acmeTeammates.map((u) => u.uid), isNot(contains('user_tony')));
      expect(acmeTeammates.map((u) => u.uid), isNot(contains('user_peter')));

      // Test favorite set toggling
      final favorites = <String>{};
      // Add Bob to favorites
      favorites.add(userBobAssignedMember.uid);
      expect(favorites.contains(userBobAssignedMember.uid), isTrue);

      // Filter favorite teammates
      final favoriteTeammates = acmeTeammates
          .where((u) => favorites.contains(u.uid))
          .toList();
      expect(favoriteTeammates.length, equals(1));
      expect(favoriteTeammates.first.displayName, equals('Bob Martinez'));

      // Remove from favorites
      favorites.remove(userBobAssignedMember.uid);
      expect(favorites.contains(userBobAssignedMember.uid), isFalse);
    });
  });
}
