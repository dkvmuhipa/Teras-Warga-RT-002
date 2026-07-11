declare module '../admin/DarkModeToggle' {
  const DarkModeToggle: React.FC;
  export default DarkModeToggle;
}

declare module '../admin/MapCanvas' {
  import { House, MapPoint } from '../../types';
  interface MapCanvasProps {
    houses: House[];
    mapPoints?: MapPoint[];
    onMarkerClick?: (houseId: string) => void;
  }
  const MapCanvas: React.FC<MapCanvasProps>;
  export default MapCanvas;
}

declare module '../admin/TabBar' {
  type Tab = 'profile' | 'finance' | 'history';
  interface TabBarProps {
    activeTab: Tab;
    setActiveTab: (tab: Tab) => void;
  }
  const TabBar: React.FC<TabBarProps>;
  export default TabBar;
}
