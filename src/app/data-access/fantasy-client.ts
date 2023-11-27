// @ts-ignore
import { Client } from 'espn-fantasy-football-api/node';

export class FantasyClient {
    private readonly client: Client;
    constructor() {
        this.client = new Client({
            leagueId: process.env.LEAGUE_ID,
        });
        this.client.setCookies({
            espnS2: process.env.ESPN_S2,
            SWID: process.env.SWID,
        });
    }

    public async getBoxscoreForWeek(seasonId: number, week: number) {
        const boxscore = await this.client.getBoxscoreForWeek({
            seasonId,
            matchupPeriodId: week,
            scoringPeriodId: week,
        });
        return boxscore;
    }

    public async getTeamsAtWeek(seasonId: number, week: number) {
        const teams = await this.client.getTeamsAtWeek({
            seasonId,
            scoringPeriodId: week,
        });
        return teams;
    }

    public async getCurrentWeek(year: number) {
        try {
            const leagueInfo = await this.client.getLeagueInfo({ seasonId: year});
            const { currentScoringPeriodId, currentMatchupPeriodId } = leagueInfo;
            return {
                currentScoringPeriodId,
                currentMatchupPeriodId,
            };
        } catch (e) {
            console.log('error getting current week', e);
            return {
                currentScoringPeriodId: 11,
                currentMatchupPeriodId: 11,
            };
        }
    }
}
