import { Page, Text } from "@geist-ui/core";
import { NextPage } from "next";

const Projects: NextPage = () => {
    return (
        <Page className="page-height" dotBackdrop={true}>
            <Page.Header>
                <Text h2>My Projects</Text>
            </Page.Header>
        </Page>
    )
}

export default Projects;