import { CreateProjectModal } from '@components/project/CreateProjectModal';
import { ProjectsDisplay } from '@components/project/ProjectsDisplay';
import { Button, Page, Text, useModal } from '@geist-ui/core';
import { Plus } from '@geist-ui/icons';
import { authOptions } from '@pages/api/auth/[...nextauth]';
import { trpc } from '@utils/trpc';
import { GetServerSideProps, NextPage } from 'next';
import { unstable_getServerSession } from 'next-auth';
import React, { useEffect } from 'react';

const Projects: NextPage = () => {
  const trpcContext = trpc.useContext();

  const { setVisible, bindings: modalBindings } = useModal();

  useEffect(() => {
    trpcContext.invalidateQueries(['project-get']);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const closeModal = (status: boolean) => {
    if (status) {
      trpcContext.invalidateQueries(['project-get']);
    }
    setVisible(false);
  };

  return (
    <>
      <Page className="page-height">
        <Page.Header>
          <div className="flex items-center gap-3">
            <Text h2>My Projects</Text>
            <Button auto icon={<Plus />} px={0.6} type="success" onClick={() => setVisible(true)} />
          </div>
        </Page.Header>
        <Page.Content>
          <ProjectsDisplay />
        </Page.Content>
      </Page>
      <CreateProjectModal onCloseModel={closeModal} bindings={modalBindings} />
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await unstable_getServerSession(context.req, context.res, authOptions);

  if (!session?.user) {
    return {
      redirect: { destination: '/', permanent: false },
    };
  }

  return {
    props: { session },
  };
};

export default Projects;
