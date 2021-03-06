package com.x.okr.assemble.control.jaxrs.okrworkreportprocesslog;

import com.x.base.core.exception.PromptException;

class ReportProcessLogDeleteException extends PromptException {

	private static final long serialVersionUID = 1859164370743532895L;

	ReportProcessLogDeleteException( Throwable e, String id ) {
		super("删除指定ID的工作汇报处理人信息时发生异常。ID：" + id, e );
	}
}
