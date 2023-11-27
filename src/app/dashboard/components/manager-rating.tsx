import { FantasyClient } from "@/app/data-access/fantasy-client";
import { Optimizer } from "@/app/analysis/optimizer";
import { Transactions } from "@/app/analysis/transactions";
import { PointsVsLeagueAvg } from "@/app/analysis/points-vs-league-avg";
import { BubbleChart } from './bubble-chart';
import { PointsDiscrepancyChart } from './score-discrepancy-chart';
import { PointsDifferentialChart } from './points-differential-chart';
import { TransactionTotalsChart } from './transaction-totals-chart';
import { TransactionsByWeekChart } from './transactions-by-week-chart';
import { PointsPerTransactionChart } from "./points-per-transaction";
import { PointsVsLeagueAvgByWeekChart } from "./points-vs-avg-by-week-chart";

export const ManagerRating = async () => {
    // get games for season
    // get lineups for games
    // find out if optimal lineup was used
    // if not, find out if optimal lineup would have won game
    // record lucky wins, deserved wins, manager-caused losses, and deserved losses
    // display on graph
    // -- goal is to see if manager is good
    // -- plot actual points against results of optimal lineup


    interface Week {
        week: number;
        matchups: Matchup[];
    }

    interface Matchup {
        home: Team;
        away: Team;
    }

    interface Team {
        name: string;
        score: number;
        optimalScore: number;
        numChanges: number;
    }

    interface Results {
        deservedWin: number;
        luckyWin: number;
        deservedLoss: number;
        blownLoss: number;
    }

    const client = new FantasyClient();
    const seasonId = 2023;
    const { currentScoringPeriodId, currentMatchupPeriodId } = await client.getCurrentWeek(seasonId);
    const week = currentScoringPeriodId;

    const bestLineups: {[key: number]: any} = {};
    const teams: {[key: number]: any} = {};
    const fetchTeams = async () => {
        const fetchedTeams: any[] = await client.getTeamsAtWeek(seasonId, week);
        fetchedTeams.map((team) => {
            teams[team.id] = {
                name: team.name,
                wins: team.wins,
                losses: team.losses,
                pointsFor: team.regularSeasonPointsFor,
                pointsAgainst: team.regularSeasonPointsAgainst,
                playoffSeed: team.playoffSeed,
            }
        });
    }

    await fetchTeams();

    const transactions = new Transactions();
    const pointsVsLeagueAvgAnalysis = new PointsVsLeagueAvg();
    const teamScoresByWeek: {[key: number]: number[]} = {};

    const results: {[key: number]: Results} = {};
    for (let i = 1; i <= week; i++) {
        const matchups: any[] = await client.getBoxscoreForWeek(seasonId, i);
        matchups.map((matchup) => {
            pointsVsLeagueAvgAnalysis.handleMatchupForWeek(matchup, i);
            bestLineups[matchup.awayTeamId] = Optimizer.analyzeLineup(matchup.awayRoster, matchup.awayScore);
            bestLineups[matchup.homeTeamId] = Optimizer.analyzeLineup(matchup.homeRoster, matchup.homeScore);
            transactions.calculateChanges(matchup.awayTeamId, matchup.awayRoster, i);
            transactions.calculateChanges(matchup.homeTeamId, matchup.homeRoster, i);
            const awayTeam = matchup.awayTeamId;
            const homeTeam = matchup.homeTeamId;
            const awayTeamScore = matchup.awayScore;
            if (!teamScoresByWeek[awayTeam]) {
                teamScoresByWeek[awayTeam] = [];
            }
            teamScoresByWeek[awayTeam].push(awayTeamScore);
            if (!teamScoresByWeek[homeTeam]) {
                teamScoresByWeek[homeTeam] = [];
            }
            teamScoresByWeek[homeTeam].push(matchup.homeScore);
            const homeTeamScore = matchup.homeScore;
            const awayTeamOptimalScore = bestLineups[awayTeam].bestScore;
            const homeTeamOptimalScore = bestLineups[homeTeam].bestScore;
            if (!results[awayTeam]) {
                results[awayTeam] = {
                    deservedWin: 0,
                    luckyWin: 0,
                    deservedLoss: 0,
                    blownLoss: 0,
                };
            }
            if (!results[homeTeam]) {
                results[homeTeam] = {
                    deservedWin: 0,
                    luckyWin: 0,
                    deservedLoss: 0,
                    blownLoss: 0,
                };
            }
            const awayOptimal = awayTeamScore === awayTeamOptimalScore;
            const homeOptimal = homeTeamScore === homeTeamOptimalScore;

    // if both teams were optimal, record as deserved win/loss
    // if teams non optimal score is higher than other teams optimal score, record as deserved win/loss
    // if team has a non optimal score less then the opponents optimal, but a higher optimal than opponent, record as lucky win and blown loss

            if (awayOptimal && homeOptimal) {
                if (awayTeamScore > homeTeamScore) {
                    results[awayTeam].deservedWin++;
                    results[homeTeam].deservedLoss++;
                } else {
                    results[awayTeam].deservedLoss++;
                    results[homeTeam].deservedWin++;
                }
            } else if (awayOptimal) { // home team not optimal
                if (homeTeamScore > awayTeamScore) {
                    results[homeTeam].deservedWin++;
                    results[awayTeam].deservedLoss++;
                } else if (homeTeamOptimalScore > awayTeamScore) {
                    results[homeTeam].blownLoss++;
                    results[awayTeam].luckyWin++;
                } else {
                    results[homeTeam].deservedLoss++;
                    results[awayTeam].deservedWin++;
                }
            } else if (homeOptimal) { // away team not optimal
                if (awayTeamScore > homeTeamScore) {
                    results[awayTeam].deservedWin++;
                    results[homeTeam].deservedLoss++;
                }
                else if (awayTeamOptimalScore > homeTeamScore) {
                    results[awayTeam].blownLoss++;
                    results[homeTeam].luckyWin++;
                } else {
                    results[awayTeam].deservedLoss++;
                    results[homeTeam].deservedWin++;
                }
            } else { // neither team optimal
                if (awayTeamScore > homeTeamScore) {
                    if (homeTeamOptimalScore > awayTeamScore) {
                        results[awayTeam].luckyWin++;
                        results[homeTeam].blownLoss++;
                    } else {
                        results[awayTeam].deservedWin++;
                        results[homeTeam].deservedLoss++;
                    }
                } else {
                    if (awayTeamOptimalScore > homeTeamScore) {
                        results[homeTeam].luckyWin++;
                        results[awayTeam].blownLoss++;
                    } else {
                        results[homeTeam].deservedWin++;
                        results[awayTeam].deservedLoss++;
                    }
                }
            }
        });
    }

    const bubbleData = {
        datasets: Object.keys(results).map((teamId) => ({
            type: 'bubble',
            label: teams[parseInt(teamId)].name,
            data: [{
                x: (results[parseInt(teamId)].deservedWin + results[parseInt(teamId)].luckyWin) - (results[parseInt(teamId)].deservedLoss + results[parseInt(teamId)].blownLoss),
                y: Math.floor(results[parseInt(teamId)].deservedLoss / (results[parseInt(teamId)].deservedLoss + results[parseInt(teamId)].blownLoss) * 100),
                r: Math.floor(results[parseInt(teamId)].luckyWin / (results[parseInt(teamId)].deservedWin + results[parseInt(teamId)].luckyWin) * 50 + 10),
            }],
            backgroundColor: `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.9)`,
        })),
    };

    const getRating = (results: any) => {
        const deservedWin = results.deservedWin;
        const luckyWin = results.luckyWin;
        const deservedLoss = results.deservedLoss;
        const blownLoss = results.blownLoss;
        const totalGames = deservedWin + luckyWin + deservedLoss + blownLoss;
        const deservedWinPct = deservedWin / totalGames;
        const luckyWinPct = luckyWin / totalGames;
        const deservedLossPct = deservedLoss / totalGames;
        const blownLossPct = blownLoss / totalGames;
        const deservedWinRating = deservedWinPct * 100;
        const luckyWinRating = luckyWinPct * 50;
        const deservedLossRating = deservedLossPct * 50;
        const blownLossRating = blownLossPct * 100;
        return Math.round(deservedWinRating + luckyWinRating - deservedLossRating - blownLossRating);
    };

    const getPointsDiscrepancyData = () => {
        const sortedKeys = Object.keys(teams).sort((a, b) => parseInt(a) - parseInt(b));
        const data = {
            labels: sortedKeys.map((teamId) => teams[parseInt(teamId)].name),
            datasets: [{
                label: 'Points For',
                data: sortedKeys.map((teamId) => teams[parseInt(teamId)].pointsFor),
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
            }, {
                label: 'Points Against',
                data: sortedKeys.map((teamId) => teams[parseInt(teamId)].pointsAgainst),
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderColor: 'rgba(255,99,132,1)',
            }],
        };
        return data;
    }

    const getPointsDifferentialData = () => {
        const sortedKeys = Object.keys(teams).sort((a, b) => parseInt(a) - parseInt(b));
        const data = {
            labels: sortedKeys.map((teamId) => teams[parseInt(teamId)].name),
            datasets: [{
                type: 'bar',
                label: 'Points Differential',
                data: sortedKeys.map((teamId) => teams[parseInt(teamId)].pointsFor - teams[parseInt(teamId)].pointsAgainst),
                backgroundColor: Object.keys(teams).map(t => `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.6)`),
            }, {
                type: 'line',
                label: 'Avg Points Against',
                data: sortedKeys.map((teamId) => teams[parseInt(teamId)].pointsAgainst / week),
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderColor: 'rgba(255,99,132,1)',
            }],
        };
        return data;
    }

    const getTotalTransactionsData = () => {
        const sortedKeys = Object.keys(teams).sort((a, b) => parseInt(a) - parseInt(b));
        const data = {
            labels: sortedKeys.map((teamId) => teams[parseInt(teamId)].name),
            datasets: [{
                data: sortedKeys.map((teamId) => transactions.getTeamTotalTransactions(teamId)),
                backgroundColor: Object.keys(teams).map(t => `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.6)`),
                hoverOffset: 4,
            }],
        };
        return data;
    }

    const getTransactionsByWeekData = () => {
        const sortedKeys = Object.keys(teams).sort((a, b) => parseInt(a) - parseInt(b));
        const data = {
            // labels 'week x'
            labels: Array.from(Array(week).keys()).map(w => `Week ${w + 1}`),
            datasets: sortedKeys.map((teamId) => ({
                type: 'line',
                label: teams[parseInt(teamId)].name,
                data: transactions.getTeamTransactionsByWeek(teamId),
                tension: 0.1,
            })),
        };
        return data;
    }

    const getPointsPerTransactionData = () => {
        const sortedKeys = Object.keys(teams).sort((a, b) => parseInt(a) - parseInt(b));
        const data = {
            labels: sortedKeys.map((teamId) => teams[parseInt(teamId)].name),
            datasets: [{
                type: 'bar',
                label: 'Points Per Transaction',
                data: sortedKeys.map((teamId) => {
                    const teamTransactions = transactions.getTeamTransactionsByWeek(teamId);
                    const avgPoints = teams[parseInt(teamId)].pointsFor / week;
                    const pointsPerTransaction = [];
                    for (let i = 0; i < week; i++) {
                        const transaction = teamTransactions[i];
                        if (!transaction) {
                            pointsPerTransaction.push(0);
                            continue;
                        }
                        const score = teamScoresByWeek[parseInt(teamId)][i];
                        const diff = score - avgPoints;
                        pointsPerTransaction.push(diff / transaction);
                    }
                    return pointsPerTransaction.reduce((a, b) => a + b, 0) / pointsPerTransaction.length;
                }),
                backgroundColor: Object.keys(teams).map(t => `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.6)`),
            }],
        };
        return data;
    }

    const getPointsVsLeagueAvgData = () => {
        // want to know: 
        //  points per team per week - y axis
        //  whether team won or lost - chart point type
        //  league avg points for that week - line chart
        const sortedKeys = Object.keys(teams).sort((a, b) => parseInt(a) - parseInt(b));
        // object mapping teamid to random background color
        const backgroundColors = Object.keys(teams).reduce((acc, teamId) => {
            //@ts-ignore
            acc[teamId] = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.8)`;
            return acc;
        }, {});

        const averages = pointsVsLeagueAvgAnalysis.calculateLeagueAvgForWeek();
        const datasets: any[] = [];
        sortedKeys.forEach((teamId) => {
            const dataset = {
                type: 'scatter',
                data: [],
                pointStyle: [],
                label: teams[parseInt(teamId)].name,
                //@ts-ignore
                backgroundColor: backgroundColors[teamId],
                //@ts-ignore
                borderColor: backgroundColors[teamId],
                borderWidth: 2,
                radius: 5,
            }
            const data: any[] = [];
            const pointStyles = [];
            for (let i = 1; i <= week; i++) {
                const results = pointsVsLeagueAvgAnalysis.getTeamScoreForWeek(teamId, i);
                pointStyles.push(results.win ? 'circle' : 'crossRot');
                data.push({
                    x: i + 1,
                    y: results.points,
                });
            }
            //@ts-ignore
            dataset.pointStyle = pointStyles;
            //@ts-ignore
            dataset.data = data;
            datasets.push(dataset);
        });

        const data = {
            // labels 'week x'
            labels: Array.from(Array(week).keys()).map(w => `Week ${w + 1}`),
            datasets: [...datasets,
            {
                type: 'line',
                label: 'League Avg',
                data: Array.from(Array(week).keys()).map((w) => {
                    const points = averages[w + 1];
                    return {
                        x: w,
                        y: points,
                    };
                }),
                tension: 0.1,
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                borderColor: 'rgba(255, 255, 255, 0.9)',
             }],
        };
        return data;
    }

    return(
        <>
            <div>
                <h1>Manager Ratings</h1>
                <table>
                    <tr>
                        <th style={{ padding: '16px' }}>Team</th>
                        <th style={{ padding: '16px' }}>Deserved Wins</th>
                        <th style={{ padding: '16px' }}>Lucky Wins</th>
                        <th style={{ padding: '16px' }}>Deserved Losses</th>
                        <th style={{ padding: '16px' }}>Blown Losses</th>
                        <th style={{ padding: '16px' }}>Rating</th>
                    </tr>
                    { Object.keys(results).sort((a, b) => {
                        //@ts-ignore
                        const ratingA = getRating(results[a]);
                        //@ts-ignore
                        const ratingB = getRating(results[b]);
                        return ratingB - ratingA;
                    }).map((key) => {
                        const id = parseInt(key);
                        return(
                            <tr>
                                <td style={{ padding: '16px' }}>{teams[id].name}</td>
                                <td style={{ padding: '16px' }}>{results[id].deservedWin}</td>
                                <td style={{ padding: '16px' }}>{results[id].luckyWin}</td>
                                <td style={{ padding: '16px' }}>{results[id].deservedLoss}</td>
                                <td style={{ padding: '16px' }}>{results[id].blownLoss}</td>
                                <td style={{ padding: '16px' }}>{getRating(results[id])}</td>
                            </tr>
                        )
                    })}
                </table>
                <h1> Manager Rating </h1>
                <p> Manager Rating is a measure of how well you play your best guys in a given week. I had to massage the data so the up and to the right is good here, but basically: down means you didn't play guys that could have won you the matchup, right means you are winning, and big bubble means the other team could have beaten you if they had played the right guys, so you got lucky </p>
                {bubbleData.datasets.length && (<BubbleChart
                    data={bubbleData}
                />)}
                <h1>Points Discrepancy</h1>
                <p> Points Discrepancy is a measure of points for/points against </p>
                <PointsDiscrepancyChart
                    data={getPointsDiscrepancyData()}
                />
                <h1>Points Differential</h1>
                <p> Points Differential is a measure of points for - points against. I included the avg points scored against you so you could get a feel for whether you played hard teams </p>
                <PointsDifferentialChart
                    data={getPointsDifferentialData()}
                />
                <h1>Total Transactions</h1>
                <p> Total Transactions is a measure of how many transactions (trades, drops, waiver pickups) you made. </p>
                <TransactionTotalsChart
                    data={getTotalTransactionsData()}
                />
                <h1>Transactions By Week</h1>
                <p> Transactions By Week is a measure of how many transactions (trades, drops, waiver pickups) you made by week. </p>
                <TransactionsByWeekChart
                    data={getTransactionsByWeekData()}
                />
                <h1>Points Per Transaction</h1>
                <p> Points Per Transaction is a rough measure of how effective your transactions have been. More expected points per transaction means that your moves are netting points, negative means that your are netting less points that you would have if you kept your other players. </p>
                <PointsPerTransactionChart
                    data={getPointsPerTransactionData()}
                />
                <h1>Points vs League Avg</h1>
                <p> Points vs League Avg is a measure of how many points you scored compared to the league average. Points are wins, X's are losses. X's above the white lines are matchups that you would have won if you played the league average, but unfortunately your opponent went off</p>
                <PointsVsLeagueAvgByWeekChart
                    data={getPointsVsLeagueAvgData()}
                />
            </div>
        </>
    )
}
