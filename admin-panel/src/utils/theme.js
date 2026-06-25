/**
 * Brand theme — wine + charcoal palette.
 *
 *   #F3F4F4  light grey   →  page background
 *   #853953  wine         →  primary CTA, links, active states
 *   #612D53  deep wine    →  hover, focused, headers
 *   #2C2C2C  charcoal     →  sidebar background, primary text
 *
 * Plus harmonized system colors for success / warn / error.
 */

export const palette = {
  bg: '#F3F4F4',
  brand: '#853953',
  brandDark: '#612D53',
  ink: '#2C2C2C',
  inkSoft: '#6B6B6B',
  // Card / divider lines — kept subtle on purpose
  border: 'rgba(44, 44, 44, 0.08)',
  // Form-control border (inputs / selects / pickers) — visibly clearer (Vercel-style)
  controlBorder: '#B5B5B5',
  controlBorderHover: '#7A7A7A',
  controlBg: '#ffffff',
  success: '#3F7D58',
  warning: '#C8923A',
  error: '#A4243B',
  info: '#612D53'
};

const antTheme = {
  token: {
    // brand
    colorPrimary: palette.brand,
    colorLink: palette.brand,
    colorLinkHover: palette.brandDark,
    colorLinkActive: palette.brandDark,

    // status
    colorSuccess: palette.success,
    colorWarning: palette.warning,
    colorError: palette.error,
    colorInfo: palette.info,

    // surface
    colorBgBase: '#ffffff',
    colorBgLayout: palette.bg,
    colorBorder: palette.border,
    colorBorderSecondary: palette.border,

    // text
    colorTextBase: palette.ink,

    // shape & type
    borderRadius: 6,
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
    fontSize: 14
  },
  components: {
    Layout: {
      siderBg: palette.ink,
      headerBg: '#ffffff',
      bodyBg: palette.bg,
      triggerBg: palette.ink
    },
    Menu: {
      darkItemBg: palette.ink,
      darkSubMenuItemBg: palette.ink,
      darkItemSelectedBg: 'rgba(255,255,255,0.08)',
      darkItemHoverBg: 'rgba(255,255,255,0.05)',
      darkItemColor: 'rgba(255,255,255,0.65)',
      darkItemSelectedColor: '#ffffff',
      darkItemHoverColor: '#ffffff',
      itemHeight: 38,
      itemMarginInline: 8,
      itemPaddingInline: 10,
      iconSize: 16
    },
    Button: {
      borderRadius: 6,
      defaultBorderColor: palette.border,
      primaryShadow: 'none',
      defaultShadow: 'none'
    },
    Card: {
      colorBorderSecondary: palette.border,
      headerHeight: 48,
      headerHeightSM: 40,
      paddingLG: 20
    },
    Tag: {
      defaultBg: '#f5f5f5',
      defaultColor: palette.inkSoft
    },
    Table: {
      headerBg: '#fafafa',
      headerColor: palette.inkSoft,
      rowHoverBg: 'rgba(133, 57, 83, 0.04)',
      fontFamily: '"Inter Tight", "Inter", -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
      fontSize: 12,
      headerSortHoverBg: '#fafafa'
    },
    Input: {
      colorBorder: palette.controlBorder,
      hoverBorderColor: palette.controlBorderHover,
      activeBorderColor: palette.brand,
      activeShadow: '0 0 0 2px rgba(133, 57, 83, 0.12)'
    },
    InputNumber: {
      colorBorder: palette.controlBorder,
      hoverBorderColor: palette.controlBorderHover,
      activeBorderColor: palette.brand,
      activeShadow: '0 0 0 2px rgba(133, 57, 83, 0.12)'
    },
    Select: {
      colorBorder: palette.controlBorder,
      colorBgContainer: palette.controlBg,
      hoverBorderColor: palette.controlBorderHover,
      activeBorderColor: palette.brand,
      activeShadow: '0 0 0 2px rgba(133, 57, 83, 0.12)',
      optionSelectedBg: 'rgba(133, 57, 83, 0.08)'
    },
    DatePicker: {
      colorBorder: palette.controlBorder,
      hoverBorderColor: palette.controlBorderHover,
      activeBorderColor: palette.brand
    },
    TimePicker: {
      colorBorder: palette.controlBorder,
      hoverBorderColor: palette.controlBorderHover,
      activeBorderColor: palette.brand
    }
  }
};

export default antTheme;
