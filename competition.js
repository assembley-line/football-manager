import LogToFile from "./logger.js";
import {getNZDateString} from "./date.js";

export async function getCompetitions() {
    const competitionsRequest = await fetch('https://www.nrf.org.nz/api/1.0/competition/cometwidget/competitionsfromids', {
        method: "POST",
        body: JSON.stringify({
            seasonId: "2025",
            compIds: "2716550121,2716550146,2716550226,2716550719,2716550037,2716550157"

        }),
        headers: {
            'Content-Type': 'application/json; charset=UTF-8',
        },
        cache: "force-cache",
    })

    if (!competitionsRequest.ok) {
        return Response.json({message: 'Error fetching data', error: competitionsRequest.statusText}, {status: 500})
    }

    return await competitionsRequest.json()
}

export async function getOrganisation(compId, season) {
    const organisationRequest = await fetch(`https://www.nrf.org.nz/api/1.0/competition/cometwidget/organisations?ids=${compId}&season=${season}`, {
        method: "GET",
        headers: {
            'Content-Type': 'application/json; charset=UTF-8',
        },
        cache: "force-cache",
    })

    if (!organisationRequest.ok) {
        return Response.json({message: 'Error fetching data', error: organisationRequest.statusText}, {status: 500})
    }

    return await organisationRequest.json()
}

export async function getFixturesForOrg(compId, orgId, season, to, from){
    const fixturesRequest = await fetch(`https://www.nrf.org.nz/api/1.0/competition/cometwidget/filteredfixtures`, {
        method: "POST",
        body: JSON.stringify({
            competitionId: compId,
            orgIds: orgId,
            from: from.toISOString(),
            to: to.toISOString(),
            sportId: "1",
            seasonId: season,
        }),
        headers: {
            'Content-Type': 'application/json; charset=UTF-8',
        },
        cache: "force-cache",
    })

    if (!fixturesRequest.ok) {
        return Response.json({message: 'Error fetching data', error: fixturesRequest.statusText}, {status: 500})
    }

    return await fixturesRequest.json()
}

export async function getNextFixtureForTeam(compId, orgId, season, timeFrame, teamName) {
    const fixturesRequest = await fetch(`https://www.nrf.org.nz/api/1.0/competition/cometwidget/filteredfixtures`, {
        method: "POST",
        body: JSON.stringify({
            competitionId: compId,
            orgIds: orgId,
            from: getNZDateString(),
            to: getNZDateString(timeFrame),
            sportId: "1",
            seasonId: season,
        }),
        headers: {
            'Content-Type': 'application/json; charset=UTF-8',
        },
        cache: "force-cache",
    })

    LogToFile(JSON.stringify({
        competitionId: compId,
        orgIds: orgId,
        from: getNZDateString(),
        to: getNZDateString(timeFrame),
        sportId: "1",
        seasonId: season,
    }), "request")

    if (!fixturesRequest.ok) {
        return Response.json({message: 'Error fetching data', error: fixturesRequest.statusText}, {status: 500})
    }

    const allFixtures = await fixturesRequest.json()


    const teamFixtures = allFixtures.fixtures.filter((fixture) => {
        return fixture.HomeTeamNameAbbr === teamName || fixture.AwayTeamNameAbbr === teamName
    })

    LogToFile(`Fetched team fixtures: ${JSON.stringify({teamFixtures})}`)

    return teamFixtures[0] || null
}
