package com.x.okr.assemble.control.jaxrs.okrcenterworkinfo.exception;

import com.x.base.core.exception.PromptException;

public class WorkTaskCreateException extends PromptException {

	private static final long serialVersionUID = 1859164370743532895L;

	public WorkTaskCreateException( Throwable e ) {
		super("工作部署待办生成过程中发生异常。", e );
	}
}
