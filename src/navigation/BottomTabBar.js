import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ROUTES } from '../constants/routes';
import { COLORES_MARCA, COLORES_NEUTROS } from '../styles/colors';
import { BORDES, ESPACIADO, TIPOGRAFIA } from '../styles/globalStyles';

const ACTIVE_COLOR = COLORES_MARCA.verdeMedio;
const INACTIVE_COLOR = COLORES_NEUTROS.textoPrincipal;

export default function BottomTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.outer, { paddingBottom: Math.max(insets.bottom - ESPACIADO.pequeno, ESPACIADO.minimo) }]}>
      <View style={styles.container}>
        {state.routes.map((route, index) => {
          const descriptor = descriptors[route.key];
          const options = descriptor.options;
          const focused = state.index === index;
          const isNew = route.name === ROUTES.NUEVO;
          const color = focused ? ACTIVE_COLOR : INACTIVE_COLOR;
          const label = typeof options.tabBarLabel === 'string'
            ? options.tabBarLabel
            : options.title || route.name;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({ type: 'tabLongPress', target: route.key });
          };

          const icon = options.tabBarIcon?.({
            focused,
            color: isNew ? COLORES_MARCA.verdeClaro : color,
            size: isNew ? 24 : 26,
          });

          return (
            <Pressable
              key={route.key}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              accessibilityRole="tab"
              accessibilityState={focused ? { selected: true } : {}}
              accessibilityValue={options.tabBarAccessibilityValue}
              onLongPress={onLongPress}
              onPress={onPress}
              testID={options.tabBarButtonTestID}
              style={[styles.item, isNew && styles.newItem]}
            >
              {focused && !isNew ? <View style={styles.activeIndicator} /> : null}
              {isNew ? <View style={styles.newIcon}>{icon}</View> : icon}
              <Text style={[styles.label, { color }, isNew && styles.newLabel]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    backgroundColor: COLORES_NEUTROS.superficie,
    paddingHorizontal: 0,
  },
  container: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: COLORES_NEUTROS.superficie,
    borderColor: COLORES_NEUTROS.borde,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: ESPACIADO.pequeno,
    paddingTop: ESPACIADO.minimo,
  },
  item: {
    flex: 1,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: ESPACIADO.minimo,
    paddingTop: ESPACIADO.minimo,
  },
  newItem: {
    paddingTop: ESPACIADO.minimo,
  },
  activeIndicator: {
    position: 'absolute',
    top: -2,
    width: 42,
    height: 3,
    backgroundColor: ACTIVE_COLOR,
    borderRadius: BORDES.radios.circular,
  },
  newIcon: {
    position: 'absolute',
    top: -23,
    width: 54,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORES_MARCA.verdeOscuro,
    borderColor: COLORES_MARCA.verdeClaro,
    borderRadius: BORDES.radios.circular,
    borderWidth: 0,
    elevation: 6,
    shadowColor: COLORES_MARCA.verdeClaro,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.55,
    shadowRadius: 8,
  },
  label: {
    marginTop: 2,
    fontFamily: TIPOGRAFIA.familias.principal,
    fontSize: 11,
    fontWeight: TIPOGRAFIA.pesos.regular,
    textAlign: 'center',
  },
  newLabel: {
    position: 'absolute',
    top: 34,
  },
});
