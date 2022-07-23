import { Button, Tabs, useTheme } from "@geist-ui/core"
import { addColorAlpha } from "@components/utils/colours";
import { useState } from "react";
import { useEffect } from "react";
import { useConfigs } from "@context/config";
import { Sun, Moon } from '@geist-ui/icons'
import { useRouter } from "next/router";

const Nav: React.FC = () => {
    const router = useRouter();
    const [currentUrl, setCurrentUrl] = useState("");
    const theme = useTheme();
    const { onThemeChange } = useConfigs();

    const tabChange = (tab: string) => {
        setCurrentUrl(tab);
        router.push(`/${tab}`);
    }

    const isLightMode = () => theme.type === "light";

    const switchTheme = () => {
        onThemeChange(isLightMode() ? "dark" : "light");
    }

    useEffect(() => {
        setCurrentUrl(router.pathname.split("/").filter(f => !!f)[0]);
    }, [router]);

    return (
    <>
    <div className="h-[var(--nav-height)]">
        <div className="menu fixed top-0 left-0 right-0 h-[var(--nav-height)] backdrop-blur backdrop-saturate-[180] z-[999]" style={{"backgroundColor": addColorAlpha(theme.palette.background, 0.8), "boxShadow": theme.type === 'dark' ? '0 0 0 1px #333' : '0 0 15px 0 rgba(0, 0, 0, 0.1)'}}>
            <div className="content flex items-center justify-between h-[100%] select-none" style={{padding: `0 ${theme.layout.gap}`}}>
                <div className="nav-tabs flex items-center">
                    <Tabs align="center" hideDivider hideBorder onChange={tabChange} value={currentUrl} activeClassName="current" >
                        <Tabs.Item label="Home" value="" />
                        <Tabs.Item label="Projects" value="projects" />
                        <Tabs.Item label="Docs" value="docs" />
                    </Tabs>
                </div>
                <div className="actions">
                    <Button onClick={switchTheme} icon={isLightMode() ? <Sun /> : <Moon />}>{isLightMode() ? "Light" : "Dark" }</Button>
                </div>
            </div>
        </div>
    </div>
    </>
    );
}

export default Nav;