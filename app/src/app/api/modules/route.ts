import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { modules, projects } from '@/db/schema'
import { eq } from 'drizzle-orm'

// GET /api/modules - List all modules (optionally filter by projectId)
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const projectId = searchParams.get('projectId')

        if (projectId) {
            const projectModules = await db
                .select()
                .from(modules)
                .where(eq(modules.projectId, projectId))
            return NextResponse.json(projectModules)
        }

        const allModules = await db.select().from(modules)
        return NextResponse.json(allModules)
    } catch (error) {
        console.error('Failed to fetch modules:', error)
        return NextResponse.json(
            { error: 'Failed to fetch modules' },
            { status: 500 }
        )
    }
}

// POST /api/modules - Create a new module
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { projectId, name, verilogCode, fsmGraph, metadata } = body

        if (!projectId || !name) {
            return NextResponse.json(
                { error: 'projectId and name are required' },
                { status: 400 }
            )
        }

        // Verify project exists
        const [project] = await db
            .select()
            .from(projects)
            .where(eq(projects.id, projectId))

        if (!project) {
            return NextResponse.json(
                { error: 'Project not found' },
                { status: 404 }
            )
        }

        const [newModule] = await db
            .insert(modules)
            .values({ projectId, name, verilogCode, fsmGraph, metadata })
            .returning()

        return NextResponse.json(newModule, { status: 201 })
    } catch (error) {
        console.error('Failed to create module:', error)
        return NextResponse.json(
            { error: 'Failed to create module' },
            { status: 500 }
        )
    }
}
