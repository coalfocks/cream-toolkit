import * as _ from 'lodash';

interface LeagueScoring {
    [key: string]: WeekScore;
}

interface WeekScore {
    [key: number]: {
        points: number;
        win: boolean;
    };
}

export class PointsVsLeagueAvg {
    private leagueScoring: LeagueScoring = {};
    constructor() {}
    
    public calculateLeagueAvgForWeek() {
        const leagueAvg: {[key: string]: number} = {};
        Object.keys(this.leagueScoring).forEach((week) => {
            const scores = this.leagueScoring[week];
            const totalPoints = Object.keys(scores).reduce((acc, teamId) => {
                return acc + scores[teamId].points;
            }, 0);
            leagueAvg[week] = totalPoints / Object.keys(scores).length;
        });
        return leagueAvg;
    }

    public handleMatchupForWeek(lineup: any, week: number) {
        if (!this.leagueScoring[week]) {
            this.leagueScoring[week] = {};
        }
        this.leagueScoring[week][lineup.homeTeamId] = { points: lineup.homeScore, win: lineup.homeScore > lineup.awayScore };
        this.leagueScoring[week][lineup.awayTeamId] = { points: lineup.awayScore, win: lineup.awayScore > lineup.homeScore };
    }

    public getTeamScoreForWeek(teamId: string, week: number) {
        return this.leagueScoring?.[week]?.[parseInt(teamId)] || { points: 0, win: false };
    }

    public getScoresVsAverageDifferential(teamId: string) {
        let scoresVsAvg = 0;
        const leagueAvg = this.calculateLeagueAvgForWeek();
        Object.keys(this.leagueScoring).forEach((week) => {
            const teamScore = this.leagueScoring[week][parseInt(teamId)];
            scoresVsAvg += (teamScore.points - leagueAvg[week]);
        });
        return scoresVsAvg;
    }
}

