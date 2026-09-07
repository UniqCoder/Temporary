import { useWindowDimensions } from 'react-native';

/** Single breakpoint: phones vs tablets/landscape-wide. Nothing fancier is needed for this app. */
export function useResponsive() {
  const { width, height } = useWindowDimensions();
  const isTablet = width >= 700;
  const isLandscape = width > height;
  return { width, height, isTablet, isLandscape };
}
