import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { projects, modules } from '@/db/schema'
import { eq } from 'drizzle-orm'

interface RouteParams {
    params: Promise<{ id: string }>
}

// GET /api/projects/[id] - Get a single project with its modules
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params

        const [project] = await db
            .select()
            .from(projects)
            .where(eq(projects.id, id))

        if (!project) {
            return NextResponse.json(
                { error: 'Project not found' },
                { status: 404 }
            )
        }

        // Also fetch modules for this project
        const projectModules = await db
            .select()
            .from(modules)
            .where(eq(modules.projectId, id))

        return NextResponse.json({ ...project, modules: projectModules })
    } catch (error) {
        console.error('Failed to fetch project:', error)
        return NextResponse.json(
            { error: 'Failed to fetch project' },
            { status: 500 }
        )
    }
}

// PUT /api/projects/[id] - Update a project
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params
        const body = await request.json()
        const { name, description } = body

        const [updated] = await db
            .update(projects)
            .set({
                name,
                description,
                updatedAt: new Date()
            })
            .where(eq(projects.id, id))
            .returning()

        if (!updated) {
            return NextResponse.json(
                { error: 'Project not found' },
                { status: 404 }
            )
        }

        return NextResponse.json(updated)
    } catch (error) {
        console.error('Failed to update project:', error)
        return NextResponse.json(
            { error: 'Failed to update project' },
            { status: 500 }
        )
    }
}

// DELETE /api/projects/[id] - Delete a project (cascades to modules)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params

        const [deleted] = await db
            .delete(projects)
            .where(eq(projects.id, id))
            .returning()

        if (!deleted) {
            return NextResponse.json(
                { error: 'Project not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({ message: 'Project deleted successfully' })
    } catch (error) {
        console.error('Failed to delete project:', error)
        return NextResponse.json(
            { error: 'Failed to delete project' },
            { status: 500 }
        )
    }
}
