
// Do not remove these lines, if you want to benefit from automatic updates.
// source: https://raw.githubusercontent.com/JaiDoubleU/nhl-my-team-ios-widget/main/NHL-MyTeam-Widget.js; 
docs: https://github.com/thisisevanfox/nhl-my-team-ios-widget; hash: 441910220;


/********************************************************
 * script     : NHL-MyTeam-Widget.js
 * version    : 4.0.0
 * description: Widget for Scriptable.app, which shows
 *              the next games for your NHL team
 * author     : @thisisevanfox
 * support    : https://git.io/JtkA1
 * date       : 2021-08-14
 *******************************************************/

/********************************************************
 ******************** USER SETTINGS *********************
 ************ PLEASE MODIFY BEFORE FIRST RUN ************
 *******************************************************/

// Type the abbreviation of your NHL team here.
// Atlantic Division: BOS, BUF, DET, FLA, MTL, OTT, TBL, TOR
// Metropolitan Division: CAR, CBJ, NJD, NYI, NYR, PHI, PIT, WSH
// Central Division: ARI, CHI, COL, DAL, MIN, NSH, STL, WPG
// Pacific Division: ANA, CGY, EDM, LAK, SJS, SEA, VAN, VGK
const MY_NHL_TEAM = "CGY";

// Indicator if livescores should be shown.
// If you don't want to be spoilered set it to false.
// Default: true
const SHOW_LIVE_SCORES = true;

// Indicator if all scores and stats should be shown.
// If you don't want to be spoilered set it to false.
// Default: true
const SHOW_STATS_AND_STANDINGS = true;

// Indicator if the home team should show first (like it's common in Europe)
// Default: true (home team shows first, e.g. "home - away")
// false (away team shows first, e.g. "away @ home")
const SHOW_HOME_TEAM_FIRST = true;

// Indicator if the descriptions of the stats should be shown
// Default: true (W: x - L: x - OTL: x)
// false (x - x - x)
const SHOW_STATS_DESCRIPTION = true;

// URL to shares app
// Default: "nhl://" (Official NHL app)
// If you don't want anything to open, type:
// const WIDGET_URL = "";
const WIDGET_URL = "nhl://";

// Set appearance of the widget. Default apperance is set to the system color scheme.
// Device.isUsingDarkAppearance() = System color scheme (default)
// true = Widget will be in dark mode.
// false = Widget will be in light mode.
const DARK_MODE = Device.isUsingDarkAppearance();

// Indicator if caching of logos is actived (saves datavolume)
// Default: true
const CACHING_ACTIVE = true;

// Indicator if no-background.js is installed
// Default: false
// @see: https://github.com/supermamon/scriptable-no-background
const NO_BACKGROUND_INSTALLED = false;

// Indicator if no-background.js should be active
// Only matters if NO_BACKGROUND_INSTALLED is true.
const NO_BACKGROUND_ACTIVE = true;

// Indicator if no-background.js should be active for whole widget
// No background for widget and no background for stacks in the widget
// Only matters if NO_BACKGROUND_INSTALLED is true.
const NO_BACKGROUND_FULL_ACTIVE = false;

// Sizing variables
const SCREEN_HEIGHT = Device.screenResolution().height;
const WIDTH = getWidgetSizeInPoints('large').width;
const HEIGHT = getWidgetSizeInPoints('large').height;
const TINY_FONT_SIZE = 12;
const SMALL_FONT_SIZE = 13;
const MED_FONT_SIZE = 14;
const LARGE_FONT_SIZE = 16;
const EXTRA_LARGE_FONT_SIZE = 38;

const defaultCornerRadius = 9;
const WIDGET_PADDING = 40;
const DEFAULT_PADDING = 5;
const SMALL_LOGO_SIZE = 20;
const LARGE_LOGO_SIZE = 40;

const TEAM_STACK_WIDTH = (WIDTH - (DEFAULT_PADDING * 2))/2;


const { transparent } = NO_BACKGROUND_INSTALLED
  ? importModule("no-background")
  : emptyFunction();

// const WIDGET_BACKGROUND =  DARK_MODE ? Color.blue() : new  Color("#D6D6D6");
// const WIDGET_BACKGROUND = DARK_MODE
//   ? new Color("#006ee6")
//   : new Color("#5ac8fa");

const BG_COLOR_CODE = DARK_MODE
    ?materialColors().blue.a100
    : materialColors().cyan.a400;

const WIDGET_BACKGROUND = new Color(BG_COLOR_CODE);

let oNhlWidget;
if (config.runsInWidget) {
  if (config.widgetFamily === "small") {
    oNhlWidget = await createSmallWidget();
  }
  if (config.widgetFamily === "medium") {
    oNhlWidget = await createMediumWidget();
  }
  if (config.widgetFamily === "large") {
    oNhlWidget = await createLargeWidget();
  }
  Script.setWidget(oNhlWidget);
} else {
	console.error("running widget in scriptable, presenting medium by default")
  oNhlWidget = await createMediumWidget();
oNhlWidget.presentMedium();
// oNhlWidget = await createSmallWidget();
// oNhlWidget.presentSmall();
// oNhlWidget = await createLargeWidget();
// oNhlWidget.presentLarge();
}


/**
 * Adds stack for home team to the medium sized widget.
 *
 * @param {Object} oNextGameStack
 * @param {Object} oGameData
 */
async function addHomeTeamStack(oNextGameStack, oGameData) {
  const oHomeTeamStack = oNextGameStack.addStack();
  
oHomeTeamStack.layoutVertically();
  oHomeTeamStack.centerAlignContent();
  oHomeTeamStack.setPadding(DEFAULT_PADDING, DEFAULT_PADDING, DEFAULT_PADDING, DEFAULT_PADDING);
//   await  setStackBackground(oHomeTeamStack);
  oHomeTeamStack.cornerRadius = defaultCornerRadius;
  oHomeTeamStack.size = new Size(TEAM_STACK_WIDTH, 0);

  const oHomeTeamLogoStack = oHomeTeamStack.addStack();
  oHomeTeamLogoStack.layoutHorizontally();

  const oHomeLogoImage = await loadLogo(
    oGameData.homeTeam.logoLink,
    oGameData.homeTeam.abbreviation
  );
  const oHomeLogo = oHomeTeamLogoStack.addImage(oHomeLogoImage);
  oHomeLogo.imageSize = new Size(LARGE_LOGO_SIZE, LARGE_LOGO_SIZE);

  if (SHOW_LIVE_SCORES) {
    oHomeTeamLogoStack.addSpacer(45);
    const oHomeTeamGoalsText = oHomeTeamLogoStack.addText(
      oGameData.currentPeriod === 0 ? `-` : `${oGameData.homeTeam.goals}`
    );
    oHomeTeamGoalsText.font = Font.boldSystemFont(EXTRA_LARGE_FONT_SIZE);
    oHomeTeamGoalsText.textColor = getColorForCurrentAppearance();
  }

  if (SHOW_STATS_AND_STANDINGS) {
    let sHomeTeamStatsText;
    if (SHOW_STATS_DESCRIPTION) {
      sHomeTeamStatsText =
        "W: " +
        oGameData.homeTeam.record.wins +
        " - L: " +
        oGameData.homeTeam.record.losses +
        " - OTL: " +
        oGameData.homeTeam.record.ot;
    } else {
      sHomeTeamStatsText =
        oGameData.homeTeam.record.wins +
        " - " +
        oGameData.homeTeam.record.losses +
        " - " +
        oGameData.homeTeam.record.ot;
    }

    const oHomeTeamStatsText = oHomeTeamStack.addText(sHomeTeamStatsText);
    oHomeTeamStatsText.font = Font.systemFont(SMALL_FONT_SIZE);
    oHomeTeamStatsText.textColor = getColorForCurrentAppearance();

    const oHomeTeamStandingsText = oHomeTeamStack.addText(
      "Division: " +
        oGameData.homeTeam.record.divisionRank +
        "." +
        " | League: " +
        oGameData.homeTeam.record.leagueRank +
        "."
    );
    oHomeTeamStandingsText.font = Font.systemFont(TINY_FONT_SIZE);
    oHomeTeamStandingsText.textColor = getColorForCurrentAppearance();

    if (oGameData.homeTeam.topscorer.name != null) {
      const oHomeTeamTopScorerText = oHomeTeamStack.addText(
        `${oGameData.homeTeam.topscorer.name} (${oGameData.homeTeam.topscorer.points})`
      );
      oHomeTeamTopScorerText.centerAlignText();
      oHomeTeamTopScorerText.font = Font.systemFont(TINY_FONT_SIZE);
      oHomeTeamTopScorerText.textColor = getColorForCurrentAppearance();
    }
  }
}

/**
 * Adds stack for away team to the medium sized widget.
 *
 * @param {Object} oNextGameStack
 * @param {Object} oGameData
 */
async function addAwayTeamStack(oNextGameStack, oGameData) {
  const oAwayTeamStack = oNextGameStack.addStack();
  oAwayTeamStack.layoutVertically();
  oAwayTeamStack.centerAlignContent();
  oAwayTeamStack.setPadding(DEFAULT_PADDING, DEFAULT_PADDING, DEFAULT_PADDING, DEFAULT_PADDING);
//   await setStackBackground(oAwayTeamStack);
  oAwayTeamStack.cornerRadius = defaultCornerRadius;
  oAwayTeamStack.size = new Size(TEAM_STACK_WIDTH, 0);
  

  const oAwayTeamLogoStack = oAwayTeamStack.addStack();

  oAwayTeamStack.backgroundGradient = new LinearGradient(['#00000015','#00000085'], [0,1]);
 oAwayTeamStack.backgroundGradient = new LinearGradient(['#000000','#FFFFFF'], [0,1]);
 oAwayTeamLogoStack.layoutHorizontally();

  const oAwayLogoImage = await loadLogo(
    oGameData.awayTeam.logoLink,
    oGameData.awayTeam.abbreviation
  );
  const oAwayLogo = oAwayTeamLogoStack.addImage(oAwayLogoImage);
  oAwayLogo.imageSize = new Size(LARGE_LOGO_SIZE, LARGE_LOGO_SIZE);

  if (SHOW_LIVE_SCORES) {
    oAwayTeamLogoStack.addSpacer(45);

    const oAwayTeamGoalsText = oAwayTeamLogoStack.addText(
      oGameData.currentPeriod === 0 ? `-` : `${oGameData.awayTeam.goals}`
    );
    oAwayTeamGoalsText.font = Font.boldSystemFont(EXTRA_LARGE_FONT_SIZE);
    oAwayTeamGoalsText.textColor = getColorForCurrentAppearance();
  }

  if (SHOW_STATS_AND_STANDINGS) {
    let sAwayTeamStatsText;
    if (SHOW_STATS_DESCRIPTION) {
      sAwayTeamStatsText =
        "W: " +
        oGameData.awayTeam.record.wins +
        " - L: " +
        oGameData.awayTeam.record.losses +
        " - OTL: " +
        oGameData.awayTeam.record.ot;
    } else {
      sAwayTeamStatsText =
        oGameData.awayTeam.record.wins +
        " - " +
        oGameData.awayTeam.record.losses +
        " - " +
        oGameData.awayTeam.record.ot;
    }

    const oAwayTeamStatsText = oAwayTeamStack.addText(sAwayTeamStatsText);
    oAwayTeamStatsText.font = Font.systemFont(SMALL_FONT_SIZE);
    oAwayTeamStatsText.textColor = getColorForCurrentAppearance();

    const oAwayTeamStandingsText = oAwayTeamStack.addText(
      "Division: " +
        oGameData.awayTeam.record.divisionRank +
        "." +
        " | League: " +
        oGameData.awayTeam.record.leagueRank +
        "."
    );
    oAwayTeamStandingsText.font = Font.systemFont(TINY_FONT_SIZE);
    oAwayTeamStandingsText.textColor = getColorForCurrentAppearance();

    if (oGameData.awayTeam.topscorer.name != null) {
      const oAwayTeamTopScorerText = oAwayTeamStack.addText(
        `${oGameData.awayTeam.topscorer.name} (${oGameData.awayTeam.topscorer.points})`
      );
      oAwayTeamTopScorerText.font = Font.systemFont(TINY_FONT_SIZE);
      oAwayTeamTopScorerText.textColor = getColorForCurrentAppearance();
    }
  }
}

/**
 * Prepares data.
 *
 * @return {Object[]}
 */
async function prepareData() {
  const oData = {
    gameDate: "",
    venue: "",
    currentPeriod: 0,
    currentPeriodOrdinal: "",
    timeRemaining: "",
    nextGames: [],
    homeTeam: {
      abbreviation: "",
      logoLink: "",
      record: {},
      goals: "",
      topscorer: {
        name: null,
        points: "",
      },
    },
    awayTeam: {
      abbreviation: "",
      logoLink: "",
      record: {},
      goals: "",
      topscorer: {
        name: null,
        points: "",
      },
    },
  };

  const oTeamData = getTeamData();
  const oScheduleData = await fetchScheduleData(oTeamData);
  const oStandings = await fetchCurrentStandings();

  if (
    oScheduleData &&
    oScheduleData.dates.length > 0 &&
    oScheduleData.dates[0].games.length > 0
  ) {
    const oNextGame = oScheduleData.dates[0].games[0];

    if (oNextGame != undefined) {
      const oHomeTeam = oNextGame.teams.home;
      const oAwayTeam = oNextGame.teams.away;

      const oHomeTeamTopScorer = await fetchTopScorer(oHomeTeam.team.id);
      const oAwayTeamTopScorer = await fetchTopScorer(oAwayTeam.team.id);

      const oHomeTeamStandings = filterStandingsById(
        oHomeTeam.team.id,
        oStandings
      );
      const oAwayTeamStandings = filterStandingsById(
        oAwayTeam.team.id,
        oStandings
      );

      oData.gameDate = oNextGame.gameDate;
      if (oNextGame.venue) {
        oData.venue = oNextGame.venue.city
          ? oNextGame.venue.city
          : oNextGame.venue.location.city;
      }
      oData.nextGames = getNextGames(oScheduleData.dates, oTeamData);
      oData.homeTeam.abbreviation = oHomeTeam.team.abbreviation;
      oData.homeTeam.logoLink = oTeamData[oData.homeTeam.abbreviation].logo;
      oData.homeTeam.record = oHomeTeamStandings;
      oData.awayTeam.abbreviation = oAwayTeam.team.abbreviation;
      oData.awayTeam.logoLink = oTeamData[oData.awayTeam.abbreviation].logo;
      oData.awayTeam.record = oAwayTeamStandings;

      if (oHomeTeamTopScorer != null) {
        oData.homeTeam.topscorer.name = oHomeTeamTopScorer.person.fullName;
        oData.homeTeam.topscorer.points = oHomeTeamTopScorer.value;
      }
      if (oAwayTeamTopScorer != null) {
        oData.awayTeam.topscorer.name = oAwayTeamTopScorer.person.fullName;
        oData.awayTeam.topscorer.points = oAwayTeamTopScorer.value;
      }

      if (SHOW_LIVE_SCORES) {
        const oLiveData = await fetchLiveData(oNextGame.gamePk);
        if (oLiveData) {
          const oLineScore = oLiveData["linescore"];
          const bIsShootout = oLineScore.hasShootout;
          if (oLineScore) {
            oData.currentPeriod = oLineScore.currentPeriod;
            oData.currentPeriodOrdinal = oLineScore.currentPeriodOrdinal;
            oData.timeRemaining = oLineScore.currentPeriodTimeRemaining;
          }

          const oBoxScoreTeams = oLiveData.boxscore.teams;
          if (
            oBoxScoreTeams.home.teamStats.teamSkaterStats !== undefined &&
            oBoxScoreTeams.home.teamStats.teamSkaterStats.goals !== undefined
          ) {
            oData.homeTeam.goals =
              oBoxScoreTeams.home.teamStats.teamSkaterStats.goals;
            if (bIsShootout) {
              oData.homeTeam.goals =
                oLineScore.shootoutInfo.home.scores + oData.homeTeam.goals;
            }
          }

          if (
            oBoxScoreTeams.away.teamStats.teamSkaterStats !== undefined &&
            oBoxScoreTeams.away.teamStats.teamSkaterStats.goals !== undefined
          ) {
            oData.awayTeam.goals =
              oBoxScoreTeams.away.teamStats.teamSkaterStats.goals;
            if (bIsShootout) {
              oData.awayTeam.goals =
                oLineScore.shootoutInfo.away.scores + oData.awayTeam.goals;
            }
          }
        }
      }
    }
  } else {
    return null;
  }

  return oData;
}


/**
 * Creates small sized widget.
 *
 * @return {ListWidget}
 */
async function createSmallWidget() {
  // Initialise widget
  const oWidget = new ListWidget();
  oWidget.backgroundColor = WIDGET_BACKGROUND;
oWidget.setPadding(DEFAULT_PADDING, DEFAULT_PADDING, DEFAULT_PADDING, DEFAULT_PADDING);
  if (WIDGET_URL.length > 0) {
    oWidget.url = WIDGET_URL;
  }

  await addSmallWidgetData(oWidget);

  return oWidget;
}

/**
 * Creates medium sized widget.
 *
 * @return {ListWidget}
 */
async function createMediumWidget() {
  // Initialise widget
  const oWidget = new ListWidget();
  if (NO_BACKGROUND_INSTALLED && NO_BACKGROUND_ACTIVE) {
    oWidget.backgroundImage = await transparent(Script.name());
  } else {
    oWidget.backgroundColor = WIDGET_BACKGROUND;
  }
  oWidget.setPadding(
    WIDGET_PADDING, 
    WIDGET_PADDING, 
    WIDGET_PADDING,    
    WIDGET_PADDING);

  if (WIDGET_URL.length > 0) {
    oWidget.url = WIDGET_URL;
  }

  await addMediumWidgetData(oWidget);

  return oWidget;
}

/**
 * Add data to small sized widget.
 *
 * @param {ListWidget} oWidget
 */
async function addSmallWidgetData(oWidget) {
  const oGameData = await prepareData();

  if (oGameData != null) {
    let oMyTeam;
    let oOpponentTeam;
    if (oGameData.homeTeam.abbreviation == MY_NHL_TEAM) {
      oMyTeam = oGameData.homeTeam;
      oOpponentTeam = oGameData.awayTeam;
    } else {
      oOpponentTeam = oGameData.homeTeam;
      oMyTeam = oGameData.awayTeam;
    }

    const oUpperStack = oWidget.addStack();
    oUpperStack.layoutHorizontally();

    const oUpperTextStack = oUpperStack.addStack();
    oUpperTextStack.layoutVertically();

    const dGameDate = new Date(oGameData.gameDate);
    const dLocalDate = dGameDate.toLocaleString([], {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
    const oGameDateText = oUpperTextStack.addText(
      `${dLocalDate.split(",")[0]}`
    ); 
    oGameDateText.font = Font.boldSystemFont(SMALL_FONT_SIZE);
    oGameDateText.textColor = getColorForCurrentAppearance();

    if (!!dLocalDate.split(",")[1]) {
      const oGameTimeText = oUpperTextStack.addText(
        `${dLocalDate.split(",")[1].trim()}`
      );
      oGameTimeText.font = Font.boldSystemFont(SMALL_FONT_SIZE);
      oGameTimeText.textColor = getColorForCurrentAppearance();
    }

    if (oGameData.venue != "") {
      const oVenueText = oUpperTextStack.addText(`@ ${oGameData.venue}`);
      oVenueText.font = Font.boldSystemFont(SMALL_FONT_SIZE);
      oVenueText.textColor = getColorForCurrentAppearance();
    }

    oUpperStack.addSpacer();

    const oOpponentLogoImage = await loadLogo(
      oOpponentTeam.logoLink,
      oOpponentTeam.abbreviation
    );
    const oOpponentLogo = oUpperStack.addImage(oOpponentLogoImage);
    oOpponentLogo.imageSize = new Size(40, 40);

    if (SHOW_STATS_AND_STANDINGS) {
      oWidget.addSpacer(4);

      let sOpponentStatsText;
      if (SHOW_STATS_DESCRIPTION) {
        sOpponentStatsText =
          "W: " +
          oOpponentTeam.record.wins +
          " - L: " +
          oOpponentTeam.record.losses +
          " - OTL: " +
          oOpponentTeam.record.ot;
      } else {
        sOpponentStatsText =
          oOpponentTeam.record.wins +
          " - " +
          oOpponentTeam.record.losses +
          " - " +
          oOpponentTeam.record.ot;
      }

      const oOpponentTeamStatsText = oWidget.addText(sOpponentStatsText);
      oOpponentTeamStatsText.font = Font.systemFont(SMALL_FONT_SIZE);
      oOpponentTeamStatsText.textColor = getColorForCurrentAppearance();

      const oOpponentTeamStandingsText = oWidget.addText(
        "Div.: " +
          oOpponentTeam.record.divisionRank +
          "." +
          " | Lea.: " +
          oOpponentTeam.record.leagueRank +
          "."
      );
      oOpponentTeamStandingsText.font = Font.systemFont(LARGE_FONT_SIZE);
      oOpponentTeamStandingsText.textColor = getColorForCurrentAppearance();

      if (oOpponentTeam.topscorer.name != null) {
        const oOpponentTeamTopScorerText = oWidget.addText(
          `${oOpponentTeam.topscorer.name} (${oOpponentTeam.topscorer.points})`
        );
        oOpponentTeamTopScorerText.font = Font.systemFont(SMALL_FONT_SIZE);
        oOpponentTeamTopScorerText.textColor = getColorForCurrentAppearance();
      }
    }

    if (SHOW_STATS_AND_STANDINGS) {
      const oDivider = oWidget.addText(`___________________________`);
      oDivider.font = Font.boldSystemFont(6);
      oDivider.textColor = getColorForCurrentAppearance();

      oWidget.addSpacer(6);

      const oBottomStack = oWidget.addStack();
      oBottomStack.layoutHorizontally();

      const oBottomTextStack = oBottomStack.addStack();
      oBottomTextStack.layoutVertically();

      let sMyTeamStatsText;
      if (SHOW_STATS_DESCRIPTION) {
        sMyTeamStatsText =
          "W: " +
          oMyTeam.record.wins +
          " - L: " +
          oMyTeam.record.losses +
          " - OTL: " +
          oMyTeam.record.ot;
      } else {
        sMyTeamStatsText =
          oMyTeam.record.wins +
          " - " +
          oMyTeam.record.losses +
          " - " +
          oMyTeam.record.ot;
      }

      const oMyTeamStatsText = oBottomTextStack.addText(sMyTeamStatsText);
      oMyTeamStatsText.font = Font.systemFont(TINY_FONT_SIZE);
      oMyTeamStatsText.textColor = getColorForCurrentAppearance();

      const oMyTeamStandingsText = oBottomTextStack.addText(
        "Div.: " +
          oMyTeam.record.divisionRank +
          "." +
          " | Lea.: " +
          oMyTeam.record.leagueRank +
          "."
      );
      oMyTeamStandingsText.font = Font.boldSystemFont(TINY_FONT_SIZE);
      
oMyTeamStandingsText.textColor = getColorForCurrentAppearance();

      if (oMyTeam.topscorer.name != null) {
        const oMyTeamTopScorerText = oBottomTextStack.addText(
          `${oMyTeam.topscorer.name} (${oMyTeam.topscorer.points})`
        );
        oMyTeamTopScorerText.font = Font.boldSystemFont(9);
        oMyTeamTopScorerText.textColor = getColorForCurrentAppearance();
      }

      oBottomStack.addSpacer();

      const oMyTeamLogoImage = await loadLogo(
        oMyTeam.logoLink,
        oMyTeam.abbreviation
      );
      const oMyTeamLogo = oBottomStack.addImage(oMyTeamLogoImage);
      oMyTeamLogo.imageSize = new Size(25, 25);
    }
  } else {
    const oHeadingText = oWidget.addText(`No upcoming games. Season ended.`);
    oHeadingText.font = Font.boldSystemFont(SMALL_FONT_SIZE);
    oHeadingText.textColor = getColorForCurrentAppearance();

    oWidget.addSpacer();
  }
}

/**
 * Add data to medium sized widget.
 *
 * @param {ListWidget} oWidget
 */
async function addMediumWidgetData(oWidget) {
  const oGameData = await prepareData();

  const oTopRow = oWidget.addStack();
  await setStackBackground(oTopRow);
  oTopRow.cornerRadius = defaultCornerRadius;
//   oTopRow.size = new Size(308, 15);
  oTopRow.size = new Size(WIDTH, 20);
  
oTopRow.setPadding(DEFAULT_PADDING*3, DEFAULT_PADDING+3, DEFAULT_PADDING, DEFAULT_PADDING);
  oTopRow.layoutVertically();

  const oSpacerStack1 = oTopRow.addStack();
  oSpacerStack1.layoutHorizontally();
  oSpacerStack1.addSpacer();

  if (oGameData != null) {
    const oHeadingStack = oTopRow.addStack();
    oHeadingStack.layoutHorizontally();
    oHeadingStack.addSpacer();
    // oHeadingStack.setPadding(DEFAULT_PADDING, DEFAULT_PADDING +5, DEFAULT_PADDING, DEFAULT_PADDING);

    let oHeadingText;
    if (
      oGameData.currentPeriodOrdinal != undefined &&
      oGameData.currentPeriodOrdinal != null &&
      oGameData.currentPeriodOrdinal != "" &&
	  (oGameData.currentPeriodOrdinal === "1st" && oGameData.timeRemaining != "20:00") &&
      SHOW_LIVE_SCORES
    ) {
      oHeadingText = oHeadingStack.addText(
        `${oGameData.currentPeriodOrdinal} - ${oGameData.timeRemaining}`
      );
    } else {
      const dGameDate = new Date(oGameData.gameDate);
      const dLocalDate = dGameDate.toLocaleString([], {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
      const sVenueText = oGameData.venue != "" ? ` @ ${oGameData.venue}` : ``;
      oHeadingText = oHeadingStack.addText(`${dLocalDate}${sVenueText}`);
    }
    oHeadingText.font = Font.regularSystemFont(SMALL_FONT_SIZE);
    oHeadingText.textColor = getColorForCurrentAppearance();

    oHeadingStack.addSpacer();

    const oSpacerStack2 = oTopRow.addStack();
    oSpacerStack2.layoutHorizontally();
    oSpacerStack2.addSpacer();

    oWidget.addSpacer();

    const oNextGameStack = oWidget.addStack();
    oNextGameStack.layoutHorizontally();
    oNextGameStack.cornerRadius = defaultCornerRadius; 

    if (SHOW_HOME_TEAM_FIRST) {
      await addHomeTeamStack(oNextGameStack, oGameData);
      oNextGameStack.addSpacer();
      await addAwayTeamStack(oNextGameStack, oGameData);
    } else {
      await addAwayTeamStack(oNextGameStack, oGameData);
      oNextGameStack.addSpacer();
      await addHomeTeamStack(oNextGameStack, oGameData);
    }
    oWidget.addSpacer();

    const oFutureGamesStack = oWidget.addStack();
    oFutureGamesStack.layoutHorizontally();
    oFutureGamesStack.centerAlignContent(); 
    await setStackBackground(oFutureGamesStack);
    oFutureGamesStack.cornerRadius = defaultCornerRadius;
   // oFutureGamesStack.setPadding(DEFAULT_PADDING, DEFAULT_PADDING, DEFAULT_PADDING, DEFAULT_PADDING);
    oFutureGamesStack.addSpacer();
    oFutureGamesStack.size = new Size(WIDTH, SMALL_LOGO_SIZE);

    for (let i = 0; i < oGameData.nextGames.length; i++) {
      const oNextGame = oGameData.nextGames[i];

      const oFutureGame = oFutureGamesStack.addStack();
      oFutureGame.layoutHorizontally();
      oFutureGame.addSpacer();

      const oFutureGameLogoImage = await loadLogo(
    oNextGame.opponent.logoLink,
    oNextGame.opponent.abbreviation
      );
      const oNextGameLogo = oFutureGame.addImage(oFutureGameLogoImage);
      oNextGameLogo.imageSize = new Size(SMALL_LOGO_SIZE, SMALL_LOGO_SIZE);

      const dGameDate = new Date(oNextGame.gameDate);
      const dLocalDate = dGameDate.toLocaleString([], {
        month: "2-digit",
        day: "2-digit",
      });
      const oNextGameText = oFutureGame.addText(` ${dLocalDate}`);
      oNextGameText.font = Font.systemFont(SMALL_FONT_SIZE);
      oNextGameText.textColor = getColorForCurrentAppearance();
      oFutureGame.addSpacer();
    }

    oFutureGamesStack.addSpacer();
  } else {
    const oHeadingStack = oTopRow.addStack();
    oHeadingStack.layoutHorizontally();
    oHeadingStack.addSpacer();
oHeadingStack.setPadding(DEFAULT_PADDING, DEFAULT_PADDING, DEFAULT_PADDING, DEFAULT_PADDING);

    const oHeadingText = oHeadingStack.addText(
      `No upcoming games. Season ended.`
    );
    oHeadingText.font = Font.boldSystemFont(SMALL_FONT_SIZE);
    oHeadingText.textColor = getColorForCurrentAppearance();

    oHeadingStack.addSpacer();

    const oSpacerStack2 = oTopRow.addStack();
    oSpacerStack2.layoutHorizontally();
    oSpacerStack2.addSpacer();

    oWidget.addSpacer();
  }
}



/**
 * Returns next games.
 *
 * @param {Object[]} aGames
 * @param {Object} oTeamData
 * @return {Object[]}
 */
function getNextGames(aGames, oTeamData) {
  const sMyTeamId = oTeamData[MY_NHL_TEAM].id;
  const aNextGames = [];
  const iLength = aGames.length < 5 ? aGames.length : 5;

  for (let i = 1; i < iLength; i++) {
    let oData = {
      gameDate: "",
      opponent: {
        abbreviation: "",
        logoLink: "",
      },
    };

    const oGame = aGames[i].games[0];
    oData.gameDate = oGame.gameDate;
    if (oGame.teams.away.team.id == sMyTeamId) {
      oData.opponent.abbreviation = oGame.teams.home.team.abbreviation;
    } else {
      // Yeey, it's a homegame for my team :-)
      oData.opponent.abbreviation = oGame.teams.away.team.abbreviation;
    }
    oData.opponent.logoLink = oTeamData[oData.opponent.abbreviation].logo;

    aNextGames.push(oData);
  }

  return aNextGames;
}

/**
 * Filters standings by team id.
 *
 * @param {String} sTeamId
 * @param {Object} oStandings
 * @return {Object}
 */
function filterStandingsById(sTeamId, oStandings) {
  let oResult = null;
  if (oStandings) {
    oStandings.records.forEach((record) => {
      record.teamRecords.forEach((teamRecord) => {
        if (teamRecord.team.id == sTeamId) {
          oResult = {
            wins: teamRecord.leagueRecord.wins,
            losses: teamRecord.leagueRecord.losses,
            ot: teamRecord.leagueRecord.ot,
            divisionRank: teamRecord.divisionRank,
            leagueRank: teamRecord.leagueRank,
          };
        }
        if (oResult != null) {
          return oResult;
        }
      });

      if (oResult != null) {
        return oResult;
      }
    });
  }

  if (oResult === null) {
    oResult = {
      wins: 0,
      losses: 0,
      ot: 0,
      divisionRank: 0,
      leagueRank: 0,
    };
  }

  return oResult;
}

/**
 * Fetches schedule data from NHL api.
 *
 * @param {Object} oTeamData
 * @return {Object}
 */
async function fetchScheduleData(oTeamData) {
  const sMyTeamId = oTeamData[MY_NHL_TEAM].id;
  const dStartDate = new Date();

  // Games in Europe are after midnight, so subtract 6 hours
  dStartDate.setHours(dStartDate.getHours());

  const iYear = dStartDate.getFullYear();
  const iMonth = dStartDate.getMonth() + 1;
  const iDay = dStartDate.getDate();
  const sFormattedDate = iYear + "-" + iMonth + "-" + iDay;
  const sUrl = `https://statsapi.web.nhl.com/api/v1/schedule?startDate=${sFormattedDate}&endDate=2021-12-30&teamId=${sMyTeamId}&expand=schedule.teams,schedule.venue,schedule.metadata,schedule.ticket,schedule.broadcasts.all`;
  const oRequest = new Request(sUrl);
  return await oRequest.loadJSON();
}

/**
 * Fetches top scorer data from NHL api.
 *
 * @param {string} sTeamId
 * @return {Object}
 */
async function fetchTopScorer(sTeamId) {
  const sUrl = `https://statsapi.web.nhl.com/api/v1/teams/${sTeamId}?expand=team.leaders,leaders.person&leaderGameTypes=R&leaderCategories=points`;
  const oRequest = new Request(sUrl);
  const oTopScorer = await oRequest.loadJSON();

  let oResult = null;
  if (oTopScorer !== undefined) {
    if (oTopScorer.teams[0] !== undefined) {
      if (oTopScorer.teams[0].teamLeaders !== undefined) {
        oResult = oTopScorer.teams[0].teamLeaders[0].leaders[0];
        if (!oResult) {
          oResult = null;
        }
      }
    }
  }

  return oResult;
}

/**
 * Fetches live standings data from NHL api.
 *
 * @param {string} sGameId
 * @return {Object}
 */
async function fetchLiveData(sGameId) {
  const sUrl = `https://statsapi.web.nhl.com/api/v1/game/${sGameId}/feed/live`;
  const oRequest = new Request(sUrl);
  const oLiveData = await oRequest.loadJSON();

  let oResult = null;
  if (oLiveData !== undefined) {
    if (oLiveData.liveData !== undefined) {
      oResult = oLiveData.liveData;
      if (!oResult) {
        oResult = null;
      }
    }
  }

  return oResult;
}

/**
 * Fetches conference and league standings data from NHL api.
 *
 * @return {Object}
 */
async function fetchCurrentStandings() {
  const sUrl = `https://statsapi.web.nhl.com/api/v1/standings`;
  const oRequest = new Request(sUrl);
  return await oRequest.loadJSON();
}

/**
 * Loads image from thesportsdb.com or from local cache.
 *
 * @param {String} sImageUrl
 * @param {String} sTeamAbbreviation
 * @return {Object}
 */
async function loadLogo(sImageUrl, sTeamAbbreviation) {	
  let oResult;
  if (CACHING_ACTIVE) {
    // Set up the file manager.
    const oFiles = FileManager.local();

    // Set up cache
    const sCachePath = oFiles.joinPath(
      oFiles.cacheDirectory(),
      sTeamAbbreviation + "_NHL"
    );
    const bCacheExists = oFiles.fileExists(sCachePath);
	
    try {
      if (bCacheExists) {
        oResult = oFiles.readImage(sCachePath);
      } else {
        const oRequest = new Request(sImageUrl);
        oResult = await oRequest.loadImage();
        try {
          oFiles.writeImage(sCachePath, oResult);
          console.log("Created cache entry for logo of " + sTeamAbbreviation);
        } catch (e) {
          console.log(e);
        }
      }
    } catch (oError) {
      console.error(oError);
      if (bCacheExists) {
        oResult = oFiles.readImage(sCachePath);
      } else {
        console.log("Fetching logo for " + sTeamAbbreviation + " failed.");
      }
    }
  } else {
    const oRequest = new Request(sImageUrl);
    oResult = await oRequest.loadImage();
  }

  return oResult;
}

/**
 * Sets background for stack.
 *
 * @param {String} oStack
 */
async function setStackBackground(oStack) {
  if (
    NO_BACKGROUND_INSTALLED &&
    NO_BACKGROUND_ACTIVE &&
    NO_BACKGROUND_FULL_ACTIVE
  ) {
    oStack.backgroundImage = await transparent(Script.name());
  } else {
//     oStack.backgroundColor = STACK_BACKGROUND;
  }
}

/**
 * Returns color object depending if dark mode is active or not.
 *
 * @return {Object}
 */
function getColorForCurrentAppearance() {
  return DARK_MODE ? Color.white() : Color.black();
}

/**
 * Placeholder function when no-background.js isn't installed.
 *
 * @return {Object}
 */
function emptyFunction() {
  // Silence
  return {};
}

/**
 * Returns static team data.
 *
 * @return {Object}
 */
function getTeamData() {
  return {
    // New Jersey Devils
    NJD: {
      id: "1",
      logo:
        "https://www.thesportsdb.com/images/media/team/badge/ssppey1547160174.png/preview",
    },
    // New York Islanders
    NYI: {
      id: "2",
      logo:
        "https://www.thesportsdb.com/images/media/team/badge/kj8uh41546001378.png/preview",
    },
    // New York Rangers
    NYR: {
      id: "3",
      logo:
        "https://www.thesportsdb.com/images/media/team/badge/bez4251546192693.png/preview",
    },
    // Philadelphia Flyers
    PHI: {
      id: "4",
      logo:
        "https://www.thesportsdb.com/images/media/team/badge/qxxppp1421794965.png/preview",
    },
    // Pittsburgh Penguins
    PIT: {
      id: "5",
      logo:
        "https://www.thesportsdb.com/images/media/team/badge/dsj3on1546192477.png/preview",
    },
    // Boston Bruins
    BOS: {
      id: "6",
      logo:
        "https://www.thesportsdb.com/images/media/team/badge/vuspuq1421791546.png/preview",
    },
    // Buffalo Sabres
    BUF: {
      id: "7",
      logo: "https://i.imgur.com/RC2srC9.png",
    },
    // Montréal Canadiens
    MTL: {
      id: "8",
      logo:
        "https://www.thesportsdb.com/images/media/team/badge/stpryx1421791753.png/preview",
    },
    // Ottawa Senators
    OTT: {
      id: "9",
      logo:
        "https://www.thesportsdb.com/images/media/team/badge/qurpwu1421616521.png/preview",
    },
    // Toronto Maple Leafs
    TOR: {
      id: "10",
      logo:
        "https://www.thesportsdb.com/images/media/team/badge/mxig4p1570129307.png/preview",
    },
    // Carolina Hurricanes
    CAR: {
      id: "12",
      logo:
        "https://www.thesportsdb.com/images/media/team/badge/v07m3x1547232585.png/preview",
    },
    // Florida Panthers
    FLA: {
      id: "13",
      logo:
        "https://www.thesportsdb.com/images/media/team/badge/8qtaz11547158220.png/preview",
    },
    // Tampa Bay Lightning
    TBL: {
      id: "14",
      logo:
        "https://www.thesportsdb.com/images/media/team/badge/swysut1421791822.png/preview",
    },
    // Washington Capitals
    WSH: {
      id: "15",
      logo:
        "https://www.thesportsdb.com/images/media/team/badge/u17iel1547157581.png/preview",
    },
    // Chicago Blackhawks
    CHI: {
      id: "16",
      logo:
        "https://www.thesportsdb.com/images/media/team/badge/tuwyvr1422041801.png/preview",
    },
    // Detroit Red Wings
    DET: {
      id: "17",
      logo:
        "https://www.thesportsdb.com/images/media/team/badge/1c24ow1546544080.png/preview",
    },
    // Nashville Predators
    NSH: {
      id: "18",
      logo:
        "https://www.thesportsdb.com/images/media/team/badge/twqyvy1422052908.png/preview",
    },
    // St. Louis Blues
    STL: {
      id: "19",
      logo:
        "https://www.thesportsdb.com/images/media/team/badge/rsqtwx1422053715.png/preview",
    },
    // Calgary Flames
    CGY: {
      id: "20",
      logo:
        "https://www.thesportsdb.com/images/media/team/badge/yqptxx1421869532.png/preview",
    },
    // Colorado Avalanche
    COL: {
      id: "21",
      logo:
        "https://www.thesportsdb.com/images/media/team/badge/wqutut1421173572.png/preview",
    },
    // Edmonton Oilers
    EDM: {
      id: "22",
      logo:
        "https://www.thesportsdb.com/images/media/team/badge/uxxsyw1421618428.png/preview",
    },
    // Vancouver Canucks
    VAN: {
      id: "23",
      logo:
        "https://www.thesportsdb.com/images/media/team/badge/xqxxpw1421875519.png/preview",
    },
    // Anaheim Ducks
    ANA: {
      id: "24",
      logo:
        "https://www.thesportsdb.com/images/media/team/badge/6g9t721547289240.png/preview",
    },
    // Dallas Stars
    DAL: {
      id: "25",
      logo:
        "https://www.thesportsdb.com/images/media/team/badge/qrvywq1422042125.png/preview",
    },
    // Los Angeles Kings
    LAK: {
      id: "26",
      logo:
        "https://www.thesportsdb.com/images/media/team/badge/uvwtvx1421535024.png/preview",
    },
    // San Jose Sharks
    SJS: {
      id: "28",
      logo:
        "https://www.thesportsdb.com/images/media/team/badge/yui7871546193006.png/preview",
    },
    // Columbus Blue Jackets
    CBJ: {
      id: "29",
      logo:
        "https://www.thesportsdb.com/images/media/team/badge/ssytwt1421792535.png/preview",
    },
    // Minnesota Wild
    MIN: {
      id: "30",
      logo:
        "https://www.thesportsdb.com/images/media/team/badge/swtsxs1422042685.png/preview",
    },
    // Winnipeg Jets
    WPG: {
      id: "52",
      logo:
        "https://www.thesportsdb.com/images/media/team/badge/bwn9hr1547233611.png/preview",
    },
    // Arizona Coyotes
    ARI: {
      id: "53",
      logo:
        "https://www.thesportsdb.com/images/media/team/badge/wpxpsx1421868857.png/preview",
    },
    // Vegas Golden Knights
    VGK: {
      id: "54",
      logo:
        "https://www.thesportsdb.com/images/media/team/badge/9w7peh1507632324.png/preview",
    },
    SEA: {
      id: "55",
      logo:
        "https://www.thesportsdb.com/images/media/team/badge/zsx49m1595775836.png/preview",
    },
  };
}

/**
 * Creates large sized widget.
 *
 * @return {ListWidget}
 */
async function createLargeWidget() {
  // Initialise widget
  const oWidget = new ListWidget();
  oWidget.setPadding(10, 10, 10, 10);
  oWidget.url =
    "https://github.com/thisisevanfox/nhl-my-team-ios-widget/blob/main/Installation%20guide.md";

  const oHeadingStack = oWidget.addStack();
  oHeadingStack.layoutVertically();
  oHeadingStack.setPadding(7, 7, 7, 7);

  const oHeadingText = oHeadingStack.addText(
    `Currently a large widget is not supported. Only small and medium size widgets are possible. Don't know how to get it? Click the widget to read to the installation instructions.`
  );
  oHeadingText.font = Font.systemFont(16);
  oHeadingText.textColor = Color.red();

  return oWidget;
}

function materialColors() {
var colorArray ={
  "red": {
    "50": "#ffebee",
    "100": "#ffcdd2",
    "200": "#ef9a9a",
    "300": "#e57373",
    "400": "#ef5350",
    "500": "#f44336",
    "600": "#e53935",
    "700": "#d32f2f",
    "800": "#c62828",
    "900": "#b71c1c",
    "a100": "#ff8a80",
    "a200": "#ff5252",
    "a400": "#ff1744",
    "a700": "#d50000"
  },
  "pink": {
    "50": "#fce4ec",
    "100": "#f8bbd0",
    "200": "#f48fb1",
    "300": "#f06292",
    "400": "#ec407a",
    "500": "#e91e63",
    "600": "#d81b60",
    "700": "#c2185b",
    "800": "#ad1457",
    "900": "#880e4f",
    "a100": "#ff80ab",
    "a200": "#ff4081",
    "a400": "#f50057",
    "a700": "#c51162"
  },
  "purple": {
    "50": "#f3e5f5",
    "100": "#e1bee7",
    "200": "#ce93d8",
    "300": "#ba68c8",
    "400": "#ab47bc",
    "500": "#9c27b0",
    "600": "#8e24aa",
    "700": "#7b1fa2",
    "800": "#6a1b9a",
    "900": "#4a148c",
    "a100": "#ea80fc",
    "a200": "#e040fb",
    "a400": "#d500f9",
    "a700": "#aa00ff"
  },
  "deeppurple": {
    "50": "#ede7f6",
    "100": "#d1c4e9",
    "200": "#b39ddb",
    "300": "#9575cd",
    "400": "#7e57c2",
    "500": "#673ab7",
    "600": "#5e35b1",
    "700": "#512da8",
    "800": "#4527a0",
    "900": "#311b92",
    "a100": "#b388ff",
    "a200": "#7c4dff",
    "a400": "#651fff",
    "a700": "#6200ea"
  },
  "indigo": {
    "50": "#e8eaf6",
    "100": "#c5cae9",
    "200": "#9fa8da",
    "300": "#7986cb",
    "400": "#5c6bc0",
    "500": "#3f51b5",
    "600": "#3949ab",
    "700": "#303f9f",
    "800": "#283593",
    "900": "#1a237e",
    "a100": "#8c9eff",
    "a200": "#536dfe",
    "a400": "#3d5afe",
    "a700": "#304ffe"
  },
  "blue": {
    "50": "#e3f2fd",
    "100": "#bbdefb",
    "200": "#90caf9",
    "300": "#64b5f6",
    "400": "#42a5f5",
    "500": "#2196f3",
    "600": "#1e88e5",
    "700": "#1976d2",
    "800": "#1565c0",
    "900": "#0d47a1",
    "a100": "#82b1ff",
    "a200": "#448aff",
    "a400": "#2979ff",
    "a700": "#2962ff"
  },
  "lightblue": {
    "50": "#e1f5fe",
    "100": "#b3e5fc",
    "200": "#81d4fa",
    "300": "#4fc3f7",
    "400": "#29b6f6",
    "500": "#03a9f4",
    "600": "#039be5",
    "700": "#0288d1",
    "800": "#0277bd",
    "900": "#01579b",
    "a100": "#80d8ff",
    "a200": "#40c4ff",
    "a400": "#00b0ff",
    "a700": "#0091ea"
  },
  "cyan": {
    "50": "#e0f7fa",
    "100": "#b2ebf2",
    "200": "#80deea",
    "300": "#4dd0e1",
    "400": "#26c6da",
    "500": "#00bcd4",
    "600": "#00acc1",
    "700": "#0097a7",
    "800": "#00838f",
    "900": "#006064",
    "a100": "#84ffff",
    "a200": "#18ffff",
    "a400": "#00e5ff",
    "a700": "#00b8d4"
  },
  "teal": {
    "50": "#e0f2f1",
    "100": "#b2dfdb",
    "200": "#80cbc4",
    "300": "#4db6ac",
    "400": "#26a69a",
    "500": "#009688",
    "600": "#00897b",
    "700": "#00796b",
    "800": "#00695c",
    "900": "#004d40",
    "a100": "#a7ffeb",
    "a200": "#64ffda",
    "a400": "#1de9b6",
    "a700": "#00bfa5"
  },
  "green": {
    "50": "#e8f5e9",
    "100": "#c8e6c9",
    "200": "#a5d6a7",
    "300": "#81c784",
    "400": "#66bb6a",
    "500": "#4caf50",
    "600": "#43a047",
    "700": "#388e3c",
    "800": "#2e7d32",
    "900": "#1b5e20",
    "a100": "#b9f6ca",
    "a200": "#69f0ae",
    "a400": "#00e676",
    "a700": "#00c853"
  },
  "lightgreen": {
    "50": "#f1f8e9",
    "100": "#dcedc8",
    "200": "#c5e1a5",
    "300": "#aed581",
    "400": "#9ccc65",
    "500": "#8bc34a",
    "600": "#7cb342",
    "700": "#689f38",
    "800": "#558b2f",
    "900": "#33691e",
    "a100": "#ccff90",
    "a200": "#b2ff59",
    "a400": "#76ff03",
    "a700": "#64dd17"
  },
  "lime": {
    "50": "#f9fbe7",
    "100": "#f0f4c3",
    "200": "#e6ee9c",
    "300": "#dce775",
    "400": "#d4e157",
    "500": "#cddc39",
    "600": "#c0ca33",
    "700": "#afb42b",
    "800": "#9e9d24",
    "900": "#827717",
    "a100": "#f4ff81",
    "a200": "#eeff41",
    "a400": "#c6ff00",
    "a700": "#aeea00"
  },
  "yellow": {
    "50": "#fffde7",
    "100": "#fff9c4",
    "200": "#fff59d",
    "300": "#fff176",
    "400": "#ffee58",
    "500": "#ffeb3b",
    "600": "#fdd835",
    "700": "#fbc02d",
    "800": "#f9a825",
    "900": "#f57f17",
    "a100": "#ffff8d",
    "a200": "#ffff00",
    "a400": "#ffea00",
    "a700": "#ffd600"
  },
  "amber": {
    "50": "#fff8e1",
    "100": "#ffecb3",
    "200": "#ffe082",
    "300": "#ffd54f",
    "400": "#ffca28",
    "500": "#ffc107",
    "600": "#ffb300",
    "700": "#ffa000",
    "800": "#ff8f00",
    "900": "#ff6f00",
    "a100": "#ffe57f",
    "a200": "#ffd740",
    "a400": "#ffc400",
    "a700": "#ffab00"
  },
  "orange": {
    "50": "#fff3e0",
    "100": "#ffe0b2",
    "200": "#ffcc80",
    "300": "#ffb74d",
    "400": "#ffa726",
    "500": "#ff9800",
    "600": "#fb8c00",
    "700": "#f57c00",
    "800": "#ef6c00",
    "900": "#e65100",
    "a100": "#ffd180",
    "a200": "#ffab40",
    "a400": "#ff9100",
    "a700": "#ff6d00"
  },
  "deeporange": {
    "50": "#fbe9e7",
    "100": "#ffccbc",
    "200": "#ffab91",
    "300": "#ff8a65",
    "400": "#ff7043",
    "500": "#ff5722",
    "600": "#f4511e",
    "700": "#e64a19",
    "800": "#d84315",
    "900": "#bf360c",
    "a100": "#ff9e80",
    "a200": "#ff6e40",
    "a400": "#ff3d00",
    "a700": "#dd2c00"
  },
  "brown": {
    "50": "#efebe9",
    "100": "#d7ccc8",
    "200": "#bcaaa4",
    "300": "#a1887f",
    "400": "#8d6e63",
    "500": "#795548",
    "600": "#6d4c41",
    "700": "#5d4037",
    "800": "#4e342e",
    "900": "#3e2723"
  },
  "grey": {
    "50": "#fafafa",
    "100": "#f5f5f5",
    "200": "#eeeeee",
    "300": "#e0e0e0",
    "400": "#bdbdbd",
    "500": "#9e9e9e",
    "600": "#757575",
    "700": "#616161",
    "800": "#424242",
    "900": "#212121"
  },
  "bluegrey": {
    "50": "#eceff1",
    "100": "#cfd8dc",
    "200": "#b0bec5",
    "300": "#90a4ae",
    "400": "#78909c",
    "500": "#607d8b",
    "600": "#546e7a",
    "700": "#455a64",
    "800": "#37474f",
    "900": "#263238"
  }
};
  return colorArray;
}

function getWidgetSizeInPoints (widgetSize = (config.runsInWidget ? config.widgetFamily : null)) {
  // stringify device screen size
  const devSize = `${Device.screenSize().width}x${Device.screenSize().height}`
  // screen size to widget size mapping for iPhone, excluding the latest iPhone 12 series. iPad size
  const sizeMap = {
    // iPad Mini 2/3/4, iPad 3/4, iPad Air 1/2. 9.7" iPad Pro
    // '768x1024': { small: [0, 0], medium: [0, 0], large: [0, 0] },
    // 10.2" iPad
    // '1080x810': { small: [0, 0], medium: [0, 0], large: [0, 0] },
    // 10.5" iPad Pro, 10.5" iPad Air 3rd Gen
    // '1112x834': { small: [0, 0], medium: [0, 0], large: [0, 0] },
    // 10.9" iPad Air 4th Gen
    // '1180x820': { small: [0, 0], medium: [0, 0], large: [0, 0] },
    // 11" iPad Pro
    '1194x834': { small: [155, 155], medium: [329, 155], large: [345, 329] },
    // 12.9" iPad Pro
    '1366x1024': { small: [170, 170], medium: [332, 170], large: [382, 332] },
    // 12 Pro Max
    // '428x926': { small: [0, 0], medium: [0, 0], large: [0, 0] },
    // XR, 11, 11 Pro Max
    '414x896': { small: [169, 169], medium: [360, 169], large: [360, 376] },
    // 12, 12 Pro
    // '390x844': : { small: [0, 0], medium: [0, 0], large: [0, 0] },
    // X, XS, 11 Pro, 12 Mini
    '375x812': { small: [155, 155], medium: [329, 155], large: [329, 345] },
    // 6/7/8(S) Plus
    '414x736': { small: [159, 159], medium: [348, 159], large: [348, 357] },
    // 6/7/8(S) and 2nd Gen SE
    '375x667': { small: [148, 148], medium: [322, 148], large: [322, 324] },
    // 1st Gen SE
    '320x568': { small: [141, 141], medium: [291, 141], large: [291, 299] }
  }
  let widgetSizeInPoint = null

  if (widgetSize) {
    let mappedSize = sizeMap[devSize]
    if (mappedSize) {
      widgetSizeInPoint = new Size(...mappedSize[widgetSize])
    }
  }
  return widgetSizeInPoint
}
/********************************************************
 ************* MAKE SURE TO COPY EVERYTHING *************
 *******************************************************/
