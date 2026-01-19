import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { projects } from '@/db/schema'


// GET /api/projects - List all projects
export async function GET() {
    try {
        const allProjects = await db.select().from(projects)
        return NextResponse.json(allProjects)
    } catch (error) {
        console.error('Failed to fetch projects:', error)
        return NextResponse.json(
            { error: 'Failed to fetch projects' },
            { status: 500 }
        )
    }
}

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { name, description } = body

        if (!name) {
            return NextResponse.json(
                { error: 'Name is required' },
                { status: 400 }
            )
        }

        const [newProject] = await db
            .insert(projects)
            .values({ name, description })
            .returning()

        return NextResponse.json(newProject, { status: 201 })
    } catch (error) {
        console.error('Failed to create project:', error)
        return NextResponse.json(
            { error: 'Failed to create project' },
            { status: 500 }
        )
    }
}
