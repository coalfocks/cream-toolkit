import * as _ from 'lodash';

export class Optimizer {
  static filterPosition(boxscorePlayer: any, position: any) {
    return (
      boxscorePlayer.position === position ||
      _.includes(boxscorePlayer.eligiblePositions, position)
    );
  }

  static handleNonFlexPosition(lineup: any, position: any) {
    const players = _.filter(lineup, (player: any) => this.filterPosition(player, position));
    const sortedPlayers = _.sortBy(players, ['totalPoints']);
    return _.last(sortedPlayers);
  }

  static analyzeLineup(lineup: any, score: any) {
    let bestSum = 0;
    const bestRoster = [];
    let numChanges = 0;

    const bestQB = this.handleNonFlexPosition(lineup, 'QB')
    bestRoster.push(bestQB.fullName);
    bestSum += bestQB.totalPoints;
    if (bestQB.position === 'Bench') {
      numChanges += 1;
    }

    const bestDefense = this.handleNonFlexPosition(lineup, 'D/ST')
    bestRoster.push(bestDefense.fullName);
    bestSum += bestDefense.totalPoints;
    if (bestDefense.position === 'Bench') {
      numChanges += 1;
    }

    try {
        const bestDefensePlayer = this.handleNonFlexPosition(lineup, 'DP')
        bestRoster.push(bestDefensePlayer.fullName);
        bestSum += bestDefensePlayer.totalPoints;
        if (bestDefensePlayer.position === 'Bench') {
          numChanges += 1;
        }
    } catch (e) {
        console.log('no dp');
    }

    const bestKicker = this.handleNonFlexPosition(lineup, 'K')
    bestRoster.push(bestKicker.fullName);
    bestSum += bestKicker.totalPoints;
    if (bestKicker.position === 'Bench') {
      numChanges += 1;
    }


    const flexPlayers = _.filter(lineup, (player) => this.filterPosition(player, 'RB') ||
      this.filterPosition(player, 'WR') ||
      this.filterPosition(player, 'TE')
    );
    const sortedFlexPlayers = _.sortBy(flexPlayers, ['totalPoints']);

    const flexPos = { RB: 2, WR: 2, TE: 1, FLEX: 1 };

    while (_.sum(_.values(flexPos)) && !_.isEmpty(sortedFlexPlayers)) {
      const player = sortedFlexPlayers.pop();
      const acceptPlayer = () => {
        bestRoster.push(player.fullName);
        bestSum += player.totalPoints;
        if (player.position === 'Bench') {
          numChanges += 1;
        }
      }

      if (flexPos.RB && _.includes(player.eligiblePositions, 'RB')) {
        acceptPlayer();
        flexPos.RB -= 1;
      } else if (flexPos.WR && _.includes(player.eligiblePositions, 'WR')) {
        acceptPlayer();
        flexPos.WR -= 1;
      } else if (flexPos.TE && _.includes(player.eligiblePositions, 'TE')) {
        acceptPlayer();
        flexPos.TE -= 1;
      } else if (flexPos.FLEX) {
        acceptPlayer();
        flexPos.FLEX -= 1;
      }
    }

    return {
      bestScore: bestSum,
      bestRoster,
      currentScore: score,
      numChanges,
    };
  }
}

