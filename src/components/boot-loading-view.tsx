import { ActivityIndicator, StyleSheet, View } from 'react-native';

/**
 * Shared loading state for the app's boot gates (migrations, onboarding check, lock check).
 * Rendered underneath AnimatedSplashOverlay, which hides the native splash as soon as it mounts
 * — so this is what the user actually sees during the (normally brief) async checks.
 */
export function BootLoadingView() {
  return (
    <View style={styles.center}>
      <ActivityIndicator />
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
