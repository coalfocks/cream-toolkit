import * as _ from 'lodash';

interface TransactionTracker {
    [key: number]: Team;
}

interface Team {
    totalTransactions: number;
    currentLineup: number[]; // ids of players
    [key: number]: number;  // transactions by week
}

interface Player {
    id: number;
}

export class Transactions {
    private teams: TransactionTracker = {};
    constructor() {}
    
    public calculateChanges(teamId: number, lineup: Player[], week: number) {
        if (!this.teams[teamId]) {
            this.teams[teamId] = {
                totalTransactions: 0,
                currentLineup: [],
                1: 0,
            };
        }
        if (week === 1) {
            this.teams[teamId].currentLineup = lineup.map((player) => player.id);
            return;
        }
        const team = this.teams[teamId];
        const newLineupIds = _.map(lineup, 'id');
        const changes = _.difference(newLineupIds, this.teams[teamId].currentLineup);
        team.currentLineup = newLineupIds;
        team.totalTransactions += changes.length;
        team[week] = changes.length;
    }

    public getTeams() {
        return this.teams;
    }

    public getTeamTransactionsByWeek(teamId: string) {
        const team = this.teams[parseInt(teamId)];
        const transactionsByWeek = _.omit(team, ['totalTransactions', 'currentLineup']);
        return Object.keys(transactionsByWeek).sort().map((week) => transactionsByWeek[parseInt(week)]);
    }

    public getTeamTotalTransactions(teamId: string) {
        return this.teams[parseInt(teamId)].totalTransactions;
    }
}

