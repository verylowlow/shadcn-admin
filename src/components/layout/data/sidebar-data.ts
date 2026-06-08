import {
  BookOpen,
  Bot,
  FileText,
  LayoutDashboard,
  Phone,
  PhoneIncoming,
  Settings,
  Target,
  Users,
} from 'lucide-react'
import { type SidebarData } from '../types'

/** NewCallCall 定稿导航：顺序与方案一致，标签为通讯录二级 */
export const sidebarData: SidebarData = {
  user: {
    name: '管理员',
    email: 'NewCallCall',
    avatar: '',
  },
  teams: [
    {
      name: 'NewCallCall',
      logo: LayoutDashboard,
      plan: '管理控制台',
    },
  ],
  navGroups: [
    {
      title: '菜单',
      items: [
        {
          title: '概要',
          url: '/overview',
          icon: LayoutDashboard,
        },
        {
          title: '通讯录',
          icon: Users,
          items: [
            { title: '联系人', url: '/contacts' },
            { title: '标签', url: '/contacts/tags' },
          ],
        },
        {
          title: '外呼活动',
          url: '/campaigns',
          icon: Target,
        },
        {
          title: '话务流水',
          url: '/calls',
          icon: Phone,
        },
        {
          title: '业务知识库',
          url: '/wiki',
          icon: BookOpen,
        },
        {
          title: '话术模板',
          url: '/templates',
          icon: FileText,
        },
        {
          title: 'Agent',
          url: '/agents',
          icon: Bot,
        },
        {
          title: '接听设置',
          url: '/inbound-settings',
          icon: PhoneIncoming,
        },
        {
          title: '系统设置',
          url: '/settings',
          icon: Settings,
        },
      ],
    },
  ],
}
