; NightShift NSIS 安装脚本

; 设置安装界面语言
!include "MUI2.nsh"

; 安装程序属性
Name "NightShift"
OutFile "..\dist-electron\NightShift-Setup-${VERSION}.exe"
InstallDir "$PROGRAMFILES\NightShift"

; 请求管理员权限
RequestExecutionLevel admin

; 界面设置
!define MUI_ABORTWARNING
!define MUI_ICON "${NSISDIR}\Contrib\Graphics\Icons\modern-install.ico"
!define MUI_UNICON "${NSISDIR}\Contrib\Graphics\Icons\modern-uninstall.ico"

; 安装向导页面
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_LICENSE "..\LICENSE"
!insertmacro MUI_PAGE_COMPONENTS
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

; 卸载向导页面
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

; 设置语言
!insertmacro MUI_LANGUAGE "SimpChinese"

; 安装部分
Section "NightShift 应用程序" SecMain
  SectionIn RO
  
  ; 设置输出路径
  SetOutPath "$INSTDIR"
  
  ; 添加文件
  File /r "..\dist-electron\win-unpacked\*"
  
  ; 创建开始菜单快捷方式
  CreateDirectory "$SMPROGRAMS\NightShift"
  CreateShortcut "$SMPROGRAMS\NightShift\NightShift.lnk" "$INSTDIR\NightShift.exe"
  CreateShortcut "$SMPROGRAMS\NightShift\卸载 NightShift.lnk" "$INSTDIR\Uninstall NightShift.exe"
  
  ; 创建桌面快捷方式
  CreateShortcut "$DESKTOP\NightShift.lnk" "$INSTDIR\NightShift.exe"
  
  ; 写入卸载信息
  WriteUninstaller "$INSTDIR\Uninstall.exe"
  
  ; 写入注册表信息
  WriteRegStr HKLM "SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\NightShift" \
                   "DisplayName" "NightShift"
  WriteRegStr HKLM "SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\NightShift" \
                   "UninstallString" "$INSTDIR\Uninstall.exe"
  WriteRegStr HKLM "SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\NightShift" \
                   "DisplayVersion" "${VERSION}"
  WriteRegStr HKLM "SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\NightShift" \
                   "Publisher" "NightShift Team"
  WriteRegStr HKLM "SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\NightShift" \
                   "DisplayIcon" "$INSTDIR\NightShift.exe"
  WriteRegDWORD HKLM "SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\NightShift" \
                     "NoModify" 1
  WriteRegDWORD HKLM "SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\NightShift" \
                     "NoRepair" 1
  
SectionEnd

; 可选组件：文件关联
Section "文件关联" SecFileAssoc
  ; 关联 .nsproj 文件
  WriteRegStr HKCR ".nsproj" "" "NightShift.Project"
  WriteRegStr HKCR "NightShift.Project" "" "NightShift 项目文件"
  WriteRegStr HKCR "NightShift.Project\DefaultIcon" "" "$INSTDIR\NightShift.exe,0"
  WriteRegStr HKCR "NightShift.Project\shell\open\command" "" '"$INSTDIR\NightShift.exe" "%1"'
  
  ; 关联 .nsrule 文件
  WriteRegStr HKCR ".nsrule" "" "NightShift.Rule"
  WriteRegStr HKCR "NightShift.Rule" "" "NightShift 规则文件"
  WriteRegStr HKCR "NightShift.Rule\DefaultIcon" "" "$INSTDIR\NightShift.exe,0"
  WriteRegStr HKCR "NightShift.Rule\shell\open\command" "" '"$INSTDIR\NightShift.exe" "%1"'
  
SectionEnd

; 可选组件：环境路径
Section "添加到PATH环境变量" SecPath
  ; 将安装目录添加到PATH环境变量
  EnVar::SetHKLM
  EnVar::AddValue "PATH" "$INSTDIR"
  Pop $0
  
  ; 检查操作结果
  ${If} $0 == 0
    DetailPrint "成功添加到PATH环境变量"
  ${Else}
    DetailPrint "添加到PATH环境变量失败"
  ${EndIf}
  
SectionEnd

; 组件描述
LangString DESC_SecMain ${LANG_SIMPCHINESE} "安装 NightShift 主程序文件"
LangString DESC_SecFileAssoc ${LANG_SIMPCHINESE} "关联 NightShift 项目文件和规则文件"
LangString DESC_SecPath ${LANG_SIMPCHINESE} "将 NightShift 安装目录添加到系统PATH环境变量"

!insertmacro MUI_FUNCTION_DESCRIPTION_BEGIN
  !insertmacro MUI_DESCRIPTION_TEXT ${SecMain} $(DESC_SecMain)
  !insertmacro MUI_DESCRIPTION_TEXT ${SecFileAssoc} $(DESC_SecFileAssoc)
  !insertmacro MUI_DESCRIPTION_TEXT ${SecPath} $(DESC_SecPath)
!insertmacro MUI_FUNCTION_DESCRIPTION_END

; 卸载部分
Section "Uninstall"
  ; 删除开始菜单快捷方式
  Delete "$SMPROGRAMS\NightShift\NightShift.lnk"
  Delete "$SMPROGRAMS\NightShift\卸载 NightShift.lnk"
  RMDir "$SMPROGRAMS\NightShift"
  
  ; 删除桌面快捷方式
  Delete "$DESKTOP\NightShift.lnk"
  
  ; 删除安装目录
  RMDir /r "$INSTDIR"
  
  ; 删除注册表信息
  DeleteRegKey HKLM "SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\NightShift"
  
  ; 删除文件关联
  DeleteRegKey HKCR ".nsproj"
  DeleteRegKey HKCR "NightShift.Project"
  DeleteRegKey HKCR ".nsrule"
  DeleteRegKey HKCR "NightShift.Rule"
  
  ; 从PATH环境变量中移除
  EnVar::SetHKLM
  EnVar::DeleteValue "PATH" "$INSTDIR"
  Pop $0
  
  ${If} $0 == 0
    DetailPrint "成功从PATH环境变量中移除"
  ${Else}
    DetailPrint "从PATH环境变量中移除失败"
  ${EndIf}
  
SectionEnd

; 安装前检查
Function .onInit
  ; 检查是否已安装旧版本
  ReadRegStr $R0 HKLM "SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\NightShift" "UninstallString"
  StrCmp $R0 "" done
  
  ; 提示用户卸载旧版本
  MessageBox MB_OKCANCEL|MB_ICONEXCLAMATION \
  "检测到已安装的 NightShift 版本。建议先卸载旧版本再继续安装。$
  $
  单击“确定”继续安装，或“取消”退出安装程序。" \
  IDOK done
  
  ; 用户选择取消，退出安装
  Abort
  
  done:
FunctionEnd

; 安装完成后的操作
Function .onInstSuccess
  ; 显示完成消息
  MessageBox MB_YESNO|MB_ICONQUESTION \
  "NightShift 安装完成！$
  $
  是否立即启动 NightShift？" \
  IDNO NoLaunch
  
  ; 启动应用程序
  Exec "$INSTDIR\NightShift.exe"
  
  NoLaunch:
FunctionEnd