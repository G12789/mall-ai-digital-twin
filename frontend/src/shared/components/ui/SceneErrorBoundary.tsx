import { Component, type ReactNode } from 'react'
import { Button, Result } from 'antd'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: string | null
}

export default class SceneErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error: error.message }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg border border-gray-200">
          <Result
            status="warning"
            title="3D渲染异常"
            subTitle={this.state.error || 'Three.js渲染引擎出现错误，请尝试刷新页面'}
            extra={
              <Button type="primary" onClick={() => this.setState({ hasError: false, error: null })}>
                重试
              </Button>
            }
          />
        </div>
      )
    }
    return this.props.children
  }
}
